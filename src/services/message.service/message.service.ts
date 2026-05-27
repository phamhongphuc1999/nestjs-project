import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  EditMessageQueryDto,
  EditMessageResponseDto,
  GetMessageQueryDto,
  GetMessageResponseDto,
  MessageListResponseDto,
} from 'src/dto/message.dto';
import { User } from 'src/entities';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { MessageRepository } from 'src/repository/message.repository';
import { MESSAGE_TYPE } from 'src/types/global';
import { getPaginationData } from 'src/utils/common.utils';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly participantsRepository: ConversationParticipantRepository,
  ) {}

  async getMessages(user: User, query: GetMessageQueryDto): Promise<GetMessageResponseDto> {
    const { conversationId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const participant = await this.participantsRepository.findOneBy({
      userId: user.id,
      conversationId,
    });
    if (!participant) throw new ForbiddenException('User is forbidden');
    const [messages, total] = await this.messageRepository.findAndCount({
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC', id: 'DESC' },
      where: { conversationId },
      relations: { sender: true },
    });
    const data: Array<MessageListResponseDto> = messages.map((message) => {
      return {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender?.name ?? 'Deleted User',
        content: message.content,
        type: message.type,
      };
    });
    return { data, metadata: getPaginationData(limit, messages.length, total, page) };
  }

  async editMessage(user: User, query: EditMessageQueryDto): Promise<EditMessageResponseDto> {
    const { conversationId, messageId, content } = query;
    const message = await this.messageRepository.findOneBy({
      id: messageId,
      conversationId,
      senderId: user.id,
    });
    if (!message) throw new BadRequestException('Conversation not found');
    if (message.type != MESSAGE_TYPE.TEXT && message.type != MESSAGE_TYPE.EDIT_TEXT)
      throw new BadRequestException('Message must be text');
    await this.messageRepository.update(
      { id: messageId, conversationId, senderId: user.id },
      { content, type: MESSAGE_TYPE.EDIT_TEXT },
    );
    return {
      id: message.id,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      content,
      type: MESSAGE_TYPE.EDIT_TEXT,
    };
  }
}
