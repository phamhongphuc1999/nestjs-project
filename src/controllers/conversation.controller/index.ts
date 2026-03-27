import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from 'src/entities';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { ConversationRepository } from 'src/repository/conversation.repository';
import { UserRepository } from 'src/repository/user.repository';
import { ConversationService } from 'src/services/conversation.service/conversation.service';
import { ConversationController } from './conversation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    UserRepository,
    ConversationRepository,
    ConversationParticipantRepository,
  ],
})
export class ConversationModule {}
