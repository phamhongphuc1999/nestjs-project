import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { CONVERSATION_TYPE, CONVERSATION_USER_ROLE } from 'src/types/global';
import { PaginationResponseDto } from './common.dto';

export class CreatePrivateChatDto {
  @ApiProperty({ type: Number, name: 'partnerId' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partnerId: number;
}

export class AnotherParticipantDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class ConversationListItemDto {
  @ApiProperty({ type: Number, name: 'conversationId' })
  conversationId: number;

  @ApiProperty({ type: String, name: 'conversationName' })
  conversationName: string;

  @ApiProperty({ type: String, name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({ type: String, name: 'deletedAt' })
  deletedAt: Date | null;

  @ApiProperty({ type: Number, name: 'id' })
  id: number;

  @ApiProperty({ type: Number, name: 'role' })
  role: CONVERSATION_USER_ROLE;

  @ApiProperty({ type: String, name: 'updatedAt' })
  updatedAt: Date;

  @ApiProperty({ type: Number, name: 'groupType' })
  groupType: CONVERSATION_TYPE;

  @ApiProperty({ type: AnotherParticipantDto, name: 'yourParticipant' })
  yourParticipant: AnotherParticipantDto;

  @ApiProperty({ type: AnotherParticipantDto, name: 'anotherParticipant', nullable: true })
  anotherParticipant?: AnotherParticipantDto;
}

export class GetListConversationResponseDto {
  @ApiProperty({ type: () => [ConversationListItemDto], name: 'data' })
  data: ConversationListItemDto[];

  @ApiProperty({ type: PaginationResponseDto, name: 'metadata' })
  metadata: PaginationResponseDto;
}
