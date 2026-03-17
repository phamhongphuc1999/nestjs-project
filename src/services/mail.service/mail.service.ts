import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { AppConfigs } from 'src/configs/app.config';
import { SEND_EMAIL_TYPE, SendEmailPayloadType } from 'src/types/global';

const configs: {
  [type in SEND_EMAIL_TYPE]: { subject: string; template: string; toAppUrl: string };
} = {
  [SEND_EMAIL_TYPE.VERIFY]: {
    subject: 'Verification Email',
    template: 'signup',
    toAppUrl: '/login',
  },
  [SEND_EMAIL_TYPE.LOGIN]: { subject: 'Login Email', template: 'login', toAppUrl: '/' },
  [SEND_EMAIL_TYPE.RECOVER_PASSWORD]: {
    subject: 'Recovery Ownership',
    template: 'recover',
    toAppUrl: '/recover',
  },
};

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(
    type: SEND_EMAIL_TYPE,
    content: SendEmailPayloadType,
    ...params: Array<{ key: string; value: string }>
  ) {
    const config = configs[type];
    const _params = params.map((item) => `${item.key}=${encodeURIComponent(item.value)}`).join('&');
    const toAppUrl = _params
      ? `${AppConfigs.FRONTEND_URL}${config.toAppUrl}?token=${content.token}&${_params}`
      : `${AppConfigs.FRONTEND_URL}${config.toAppUrl}?token=${content.token}`;

    await this.mailerService.sendMail({
      to: content.to,
      subject: config.subject,
      template: config.template,
      context: { name: content.name, toAppUrl, currentYear: new Date().getFullYear() },
    });
  }
}
