import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/Decorations/user.decoration';
import { PaginationQueryDto } from 'src/dto/common.dto';
import { CreatePrivateChatDto, GetListConversationResponseDto } from 'src/dto/conversation.dto';
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
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @Get('/conversations')
  getListConversations(
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ): Promise<GetListConversationResponseDto> {
    return this.conversationService.getListConversations(user, query);
  }
}
