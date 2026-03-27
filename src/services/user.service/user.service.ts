import { Injectable } from '@nestjs/common';
import { OnlyOkResponseDto } from 'src/dto/common.dto';
import { User } from 'src/entities';
import { UserRepository } from 'src/repository/user.repository';
import { SEND_EMAIL_TYPE, TOKEN_TYPE } from 'src/types/global';
import { generateToken } from 'src/utils/jwt';
import { MailService } from '../mail.service/mail.service';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async sendVerifyEmail(user: User): Promise<OnlyOkResponseDto> {
    const verificationToken = generateToken(TOKEN_TYPE.EMAIL_VERIFY_TOKEN, {
      verifyEmailUserId: user.id,
    });
    await this.mailService.sendEmail(SEND_EMAIL_TYPE.VERIFY, {
      name: user.name || user.email,
      to: user.email,
      token: verificationToken,
    });
    return { isOk: true };
  }
}
