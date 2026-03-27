import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UserRepository } from 'src/repository/user.repository';
import { MailModule } from 'src/services/mail.service/mail.module';
import { UserService } from 'src/services/user.service/user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
