import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/Decorations/user.decoration';
import { PaginationQueryDto } from 'src/dto/common.dto';
import {
  CreatePrivateChatDto,
  GetListConversationResponseDto,
  GetPrivateConversationResponseDto,
} from 'src/dto/conversation.dto';
import { Conversation, User } from 'src/entities';
import { TokenSecurityGuard } from 'src/guards/access-token-security.guard';
import { ConversationService } from 'src/services/conversation.service/conversation.service';

@ApiTags('Conversations')
@Controller('conversation')
@ApiBearerAuth()
@UseGuards(TokenSecurityGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @ApiOperation({ summary: 'Create new conversation' })
  @ApiResponse({ type: Conversation })
  @Post('/create')
  createPrivateChat(
    @CurrentUser() user: User,
    @Body() body: CreatePrivateChatDto,
  ): Promise<Conversation> {
    return this.conversationService.createPrivateChat(user, body);
  }

  @ApiOperation({ summary: 'Get list conversations' })
  @ApiResponse({
    status: 200,
    description: 'Return list user conversations',
    type: GetListConversationResponseDto,
  })
  @Get('/conversations')
  getListConversations(
    @CurrentUser() user: User,
    @Param() params: PaginationQueryDto,
  ): Promise<GetListConversationResponseDto> {
    return this.conversationService.getListConversations(user, params);
  }

  @ApiOperation({ summary: 'Get private conversation' })
  @ApiResponse({
    status: 200,
    description: 'Get private conversation',
    type: GetListConversationResponseDto,
  })
  @Get('/private-conversation')
  getPrivateConversation(
    @CurrentUser() user: User,
    @Param() conversationId: number,
  ): Promise<GetPrivateConversationResponseDto> {
    return this.conversationService.getPrivateConversation(user, conversationId);
  }
}
