import { Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/Decorations/user.decoration';
import {
  EditMessageQueryDto,
  EditMessageResponseDto,
  GetMessageQueryDto,
  GetMessageResponseDto,
} from 'src/dto/message.dto';
import { User } from 'src/entities';
import { TokenSecurityGuard } from 'src/guards/access-token-security.guard';
import { MessageService } from 'src/services/message.service/message.service';

@ApiTags('Message')
@Controller('message')
@ApiBearerAuth()
@UseGuards(TokenSecurityGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOperation({ summary: 'Get historical messages in the conversation' })
  @ApiResponse({
    status: 200,
    description: 'Get historical messages in the conversation',
    type: GetMessageResponseDto,
  })
  @Get('/')
  getMessages(
    @CurrentUser() user: User,
    @Query() query: GetMessageQueryDto,
  ): Promise<GetMessageResponseDto> {
    return this.messageService.getMessages(user, query);
  }

  @ApiOperation({ summary: 'Edit text message' })
  @ApiResponse({ status: 200, description: 'Edited message', type: EditMessageResponseDto })
  @Put('/')
  editMessage(
    @CurrentUser() user: User,
    @Query() query: EditMessageQueryDto,
  ): Promise<EditMessageResponseDto> {
    return this.messageService.editMessage(user, query);
  }
}
