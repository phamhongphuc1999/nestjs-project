import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto, PaginationResponseDto } from './common.dto';
import { MESSAGE_TYPE } from 'src/types/global';

export class GetMessageQueryDto extends PaginationQueryDto {
  @ApiProperty({ type: Number, name: 'conversationId' })
  conversationId: number;
}

export class MessageListResponseDto {
  @ApiProperty({ type: Number, name: 'conversationId' })
  conversationId: number;

  @ApiProperty({ type: Number, name: 'senderId' })
  senderId: number;

  @ApiProperty({ type: String, name: 'senderName' })
  senderName: string;

  @ApiProperty({ type: String, name: 'senderEmail' })
  senderEmail: string;

  @ApiProperty({ type: String, name: 'content' })
  content: string;

  @ApiProperty({ type: Number, name: 'type' })
  type: MESSAGE_TYPE;
}

export class GetMessageResponseDto {
  @ApiProperty({ type: () => [MessageListResponseDto], name: 'data' })
  data: Array<MessageListResponseDto>;

  @ApiProperty({ type: PaginationResponseDto, name: 'metadata' })
  metadata: PaginationResponseDto;
}
