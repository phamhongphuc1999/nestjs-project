import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserWelcome(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to our app',
      template: 'login',
      context: { name },
    });
  }
}
