import { Module } from '@nestjs/common';
import { UserRepository } from 'src/repository/user.repository';
import { AuthService } from 'src/services/auth.service/auth.service';
import { GoogleOAuthService } from 'src/services/auth.service/google-oauth.service';
import { MailModule } from 'src/services/mail.service/mail.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [GoogleOAuthService, AuthService, UserRepository],
})
export class AuthModule {}
