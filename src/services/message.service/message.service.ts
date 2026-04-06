import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  GetMessageQueryDto,
  GetMessageResponseDto,
  MessageListResponseDto,
} from 'src/dto/message.dto';
import { User } from 'src/entities';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { MessageRepository } from 'src/repository/message.repository';
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
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderEmail: message.sender.email,
        content: message.content,
        type: message.type,
      };
    });
    return { data, metadata: getPaginationData(limit, messages.length, total, page) };
  }
}
