import { Module } from '@nestjs/common';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { MessageRepository } from 'src/repository/message.repository';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway, ConversationParticipantRepository, MessageRepository],
  exports: [EventsGateway],
})
export class EventsModule {}
