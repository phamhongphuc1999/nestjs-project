import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AccessTokenResponseDto,
  AuthSignupDto,
  GoogleRecoverPasswordDto,
  GoogleSigninDto,
  PasswordLoginDto,
  RecoverTokenDto,
  VerifyTokenDto,
} from 'src/dto/auth.dto';
import { OnlyOkResponseDto } from 'src/dto/common.dto';
import { User } from 'src/entities';
import { UserRepository } from 'src/repository/user.repository';
import { SEND_EMAIL_TYPE, USER_STATUS } from 'src/types/global';
import { generatePasswordHash, verifyPasswordHash } from 'src/utils/common.utils';
import { generateEmailVerifyToken, generateSignature, verifyEmailToken } from 'src/utils/jwt';
import { MailService } from '../mail.service/mail.service';
import { GoogleOAuthService } from './google-oauth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async signup(payload: AuthSignupDto): Promise<OnlyOkResponseDto> {
    const _tempUser = await this.userRepository.findOne({
      where: [{ name: payload.name }, { email: payload.email }],
    });
    if (_tempUser != undefined) throw new BadRequestException('Email is already exist');
    const hashPassword = await generatePasswordHash(payload.password);
    const newUser: User = this.userRepository.create({
      name: payload.name,
      email: payload.email,
      password: hashPassword,
      status: USER_STATUS.EMAIL_INACTIVE,
    });
    const savedUser = await this.userRepository.save(newUser);
    if (!savedUser) throw new BadRequestException('Create user failure!');

    const verificationToken = generateEmailVerifyToken({
      verifyEmailUserId: savedUser.id,
    });
    await this.mailService.sendEmail(SEND_EMAIL_TYPE.VERIFY, {
      name: payload.name,
      to: payload.email,
      token: verificationToken,
    });
    return { isOk: true };
  }

  async googleLogin(payload: GoogleSigninDto): Promise<AccessTokenResponseDto> {
    const verify = await this.googleOAuthService.verifyToken(payload.idToken);
    if (!verify) throw new UnauthorizedException('Invalid token');
    if (!verify.email) throw new BadRequestException('Email not found');
    const findUser = await this.userRepository.findOneBy({ email: verify.email });
    if (findUser) {
      return { accessToken: generateSignature({ sub: findUser.id }) };
    } else {
      const newUser: User = this.userRepository.create({
        name: verify.name || verify.email,
        email: verify.email,
        password: '',
        status: USER_STATUS.EMAIL_INACTIVE,
      });
      const savedUser = await this.userRepository.save(newUser);
      if (!savedUser) throw new BadRequestException('Create user failure!');
      const verificationToken = generateEmailVerifyToken({
        verifyEmailUserId: savedUser.id,
      });
      await this.mailService.sendEmail(SEND_EMAIL_TYPE.VERIFY, {
        name: verify.name || verify.email,
        to: verify.email,
        token: verificationToken,
      });
      return { accessToken: generateSignature({ sub: savedUser.id }) };
    }
  }

  async verifyEmail(payload: VerifyTokenDto): Promise<OnlyOkResponseDto> {
    const decodedToken = verifyEmailToken<{ verifyEmailUserId?: string }>(payload.token);
    const userId = decodedToken?.verifyEmailUserId;
    if (!userId || !decodedToken?.exp) throw new UnauthorizedException('Cannot decode token');
    const nId = parseInt(userId);
    const findUser = await this.userRepository.findOneBy({ id: nId });
    if (!findUser) throw new BadRequestException('User not found');
    if (findUser.status == USER_STATUS.EMAIL_INACTIVE) {
      await this.userRepository.update({ id: nId }, { status: USER_STATUS.ACTIVE });
    }
    return { isOk: true };
  }

  async signinWithPassword(payload: PasswordLoginDto): Promise<AccessTokenResponseDto> {
    const findUser = await this.userRepository.findOneBy({ email: payload.email });
    if (!findUser) throw new BadRequestException('Email or password is incorrect!');
    const isPasswordOk = await verifyPasswordHash(findUser.password, payload.password);
    if (!isPasswordOk) throw new BadRequestException('Email or password is incorrect!');
    const token = generateSignature({ sub: findUser.id });
    return { accessToken: token };
  }

  async sendRecoverMailPassword(payload: GoogleRecoverPasswordDto): Promise<OnlyOkResponseDto> {
    const verify = await this.googleOAuthService.verifyToken(payload.idToken);
    if (!verify) throw new UnauthorizedException('Invalid token');
    if (!verify.email) throw new BadRequestException('Email not found');
    const findUser = await this.userRepository.findOneBy({ email: verify.email });
    if (!findUser) throw new BadRequestException('User not found');
    const recoveryToken = generateEmailVerifyToken({
      recoverEmailUserId: findUser.id,
    });
    await this.mailService.sendEmail(SEND_EMAIL_TYPE.RECOVER_PASSWORD, {
      name: verify.email,
      to: verify.email,
      token: recoveryToken,
    });
    return { isOk: true };
  }

  async recoverPassword(payload: RecoverTokenDto): Promise<OnlyOkResponseDto> {
    const decodedToken = verifyEmailToken<{ recoverEmailUserId?: string }>(payload.token);
    const userId = decodedToken?.recoverEmailUserId;
    if (!userId || !decodedToken?.exp) throw new UnauthorizedException('Cannot decode token');
    const nId = parseInt(userId);
    const findUser = await this.userRepository.findOneBy({ id: nId });
    if (!findUser) throw new BadRequestException('User not found');
    const hashPassword = await generatePasswordHash(payload.newPassword);
    await this.userRepository.update({ id: nId }, { password: hashPassword });
    return { isOk: true };
  }
}
