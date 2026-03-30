import { NestFactory } from '@nestjs/core';
import { SEND_EMAIL_TYPE, TOKEN_TYPE } from 'src/types/global';
import { generateToken } from 'src/utils/jwt';
import { MailModule } from '../services/mail.service/mail.module';
import { MailService } from '../services/mail.service/mail.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MailModule);
  const mailService = app.get(MailService);

  const verificationToken = generateToken(TOKEN_TYPE.EMAIL_VERIFY_TOKEN, {
    verifyEmailUserId: '1',
  });
  await mailService.sendEmail(SEND_EMAIL_TYPE.VERIFY, {
    to: 'test@example.com',
    name: 'Peter',
    token: verificationToken,
  });

  console.log('Mail sent successfully! Check http://localhost:8025');

  await app.close();
}

bootstrap().catch(console.error);
