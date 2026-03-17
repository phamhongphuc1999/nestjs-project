import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthSignupDto } from 'src/dto/auth.dto';
import { User } from 'src/entities';
import { UserRepository } from 'src/repository/user.repository';
import { EMAIL_VERIFICATION_STATUS, SEND_EMAIL_TYPE } from 'src/types/global';
import { generatePasswordHash } from 'src/utils/common.utils';
import { generateEmailVerifyToken } from 'src/utils/jwt';
import { MailService } from '../mail.service/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async signup(payload: AuthSignupDto) {
    const _tempUser = this.userRepository.findOne({
      where: [{ name: payload.name }, { email: payload.email }],
    });
    if (_tempUser != undefined) throw new BadRequestException('Email is already exist');
    const hashPassword = await generatePasswordHash(payload.password);
    const newUser: User = this.userRepository.create({
      name: payload.name,
      email: payload.email,
      password: hashPassword,
      verificationCode: EMAIL_VERIFICATION_STATUS.INACTIVE,
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

  signupWithGoogle() {
    //
  }
}
