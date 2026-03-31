import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { MessageRepository } from 'src/repository/message.repository';
import { UserRepository } from 'src/repository/user.repository';
import { MessageService } from 'src/services/message.service/message.service';
import { MessageController } from './message.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository, UserRepository, ConversationParticipantRepository],
})
export class MessageModule {}
