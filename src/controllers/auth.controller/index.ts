import { Module } from '@nestjs/common';
import { UserRepository } from 'src/repository/user.repository';
import { AuthService } from 'src/services/auth.service/auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, UserRepository],
})
export class AuthModule {}
