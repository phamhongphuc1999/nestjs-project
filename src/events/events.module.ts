import { Module } from '@nestjs/common';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { ConversationRepository } from 'src/repository/conversation.repository';
import { MessageRepository } from 'src/repository/message.repository';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [
    EventsGateway,
    ConversationParticipantRepository,
    ConversationRepository,
    MessageRepository,
  ],
  exports: [EventsGateway],
})
export class EventsModule {}
