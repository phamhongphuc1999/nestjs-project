import { NestFactory } from '@nestjs/core';
import { MailModule } from '../services/mail.service/mail.module';
import { MailService } from '../services/mail.service/mail.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MailModule);
  const mailService = app.get(MailService);

  await mailService.sendUserWelcome('test@example.com', 'Peter');

  console.log('Mail sent successfully! Check http://localhost:8025');

  await app.close();
}

bootstrap().catch(console.error);
