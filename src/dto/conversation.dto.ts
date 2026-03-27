import { ApiProperty } from '@nestjs/swagger';
import { Conversation, ConversationParticipants } from 'src/entities';
import { PaginationResponseDto } from './common.dto';

export class CreatePrivateChatDto {
  @ApiProperty({ type: Number, description: 'partnerId' })
  partnerId: number;
}

export class GetListConversationResponseDto {
  data: ConversationParticipants[];
  metadata: PaginationResponseDto;
}

export class GetPrivateConversationResponseDto {
  conversation: Conversation;
}
