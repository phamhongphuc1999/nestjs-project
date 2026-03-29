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
import { SEND_EMAIL_TYPE, TOKEN_TYPE, USER_STATUS } from 'src/types/global';
import { generatePasswordHash, verifyPasswordHash } from 'src/utils/common.utils';
import { generateToken, verifyToken } from 'src/utils/jwt';
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

    const verificationToken = generateToken(TOKEN_TYPE.EMAIL_VERIFY_TOKEN, {
      verifyEmailUserId: savedUser.id,
    });
    await this.mailService.sendEmail(SEND_EMAIL_TYPE.VERIFY, {
      name: payload.name,
      to: payload.email,
      token: verificationToken,
    });
    return { isOk: true };
  }

  private async createRefreshToken(
    userId: number,
    data: string | object | Buffer<ArrayBufferLike>,
  ) {
    const refreshToken = generateToken(TOKEN_TYPE.REFRESH_TOKEN, data);
    await this.userRepository.update(userId, {
      refreshToken: await generatePasswordHash(refreshToken),
    });
    return refreshToken;
  }

  async googleLogin(
    payload: GoogleSigninDto,
  ): Promise<AccessTokenResponseDto & { refreshToken: string }> {
    const verify = await this.googleOAuthService.verifyToken(payload.idToken);
    if (!verify) throw new UnauthorizedException('Invalid token');
    if (!verify.email) throw new BadRequestException('Email not found');
    const findUser = await this.userRepository.findOneBy({ email: verify.email });
    if (findUser) {
      const _data = { sub: findUser.id };
      const refreshToken = await this.createRefreshToken(findUser.id, _data);
      await this.mailService.sendEmail(SEND_EMAIL_TYPE.LOGIN, {
        name: findUser.name || findUser.email,
        to: findUser.email,
      });
      return { accessToken: generateToken(TOKEN_TYPE.ACCESS_TOKEN, _data), refreshToken };
    } else {
      const newUser: User = this.userRepository.create({
        name: verify.name || verify.email,
        email: verify.email,
        password: '',
        status: USER_STATUS.EMAIL_INACTIVE,
      });
      const savedUser = await this.userRepository.save(newUser);
      if (!savedUser) throw new BadRequestException('Create user failure!');
      const verificationToken = generateToken(TOKEN_TYPE.EMAIL_VERIFY_TOKEN, {
        verifyEmailUserId: savedUser.id,
      });
      await this.mailService.sendEmail(SEND_EMAIL_TYPE.VERIFY, {
        name: verify.name || verify.email,
        to: verify.email,
        token: verificationToken,
      });
      const _data = { sub: savedUser.id };
      const refreshToken = await this.createRefreshToken(savedUser.id, _data);
      return { accessToken: generateToken(TOKEN_TYPE.ACCESS_TOKEN, _data), refreshToken };
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<AccessTokenResponseDto & { refreshToken: string }> {
    const payload = verifyToken<{ sub: number }>(TOKEN_TYPE.REFRESH_TOKEN, refreshToken);

    const findUser = await this.userRepository.findOneBy({ id: payload.sub });
    if (!findUser?.refreshToken) throw new BadRequestException();
    const isRefreshTokenOk = await verifyPasswordHash(findUser.refreshToken, refreshToken);
    if (!isRefreshTokenOk) throw new UnauthorizedException();

    const newAccessToken = generateToken(TOKEN_TYPE.ACCESS_TOKEN, payload);
    const newRefreshToken = generateToken(TOKEN_TYPE.REFRESH_TOKEN, payload);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async verifyEmail(payload: VerifyTokenDto): Promise<OnlyOkResponseDto> {
    const decodedToken = verifyToken<{ verifyEmailUserId?: string }>(
      TOKEN_TYPE.EMAIL_VERIFY_TOKEN,
      payload.token,
    );
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

  async signinWithPassword(
    payload: PasswordLoginDto,
  ): Promise<AccessTokenResponseDto & { refreshToken: string }> {
    const findUser = await this.userRepository.findOneBy({ email: payload.email });
    if (!findUser) throw new BadRequestException('Email or password is incorrect!');
    const isPasswordOk = await verifyPasswordHash(findUser.password, payload.password);
    if (!isPasswordOk) throw new BadRequestException('Email or password is incorrect!');
    const _data = { sub: findUser.id };
    const token = generateToken(TOKEN_TYPE.ACCESS_TOKEN, _data);
    const refreshToken = await this.createRefreshToken(findUser.id, _data);
    await this.mailService.sendEmail(SEND_EMAIL_TYPE.LOGIN, {
      name: findUser.name || findUser.email,
      to: findUser.email,
    });
    return { accessToken: token, refreshToken };
  }

  async sendRecoverMailPassword(payload: GoogleRecoverPasswordDto): Promise<OnlyOkResponseDto> {
    const verify = await this.googleOAuthService.verifyToken(payload.idToken);
    if (!verify) throw new UnauthorizedException('Invalid token');
    if (!verify.email) throw new BadRequestException('Email not found');
    const findUser = await this.userRepository.findOneBy({ email: verify.email });
    if (!findUser) throw new BadRequestException('User not found');
    const recoveryToken = generateToken(TOKEN_TYPE.EMAIL_VERIFY_TOKEN, {
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
    const decodedToken = verifyToken<{ recoverEmailUserId?: string }>(
      TOKEN_TYPE.EMAIL_VERIFY_TOKEN,
      payload.token,
    );
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
