import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { AppConfigs } from 'src/configs/app.config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: AppConfigs.MAIL.HOST,
        port: AppConfigs.MAIL.PORT,
        secure: false,
        auth: {
          user: AppConfigs.MAIL.USER,
          pass: AppConfigs.MAIL.PASSWORD,
        },
      },
      defaults: {
        from: '"NestJS App" <no-reply@example.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
