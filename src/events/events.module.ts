import { Module } from '@nestjs/common';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway, ConversationParticipantRepository],
  exports: [EventsGateway],
})
export class EventsModule {}
