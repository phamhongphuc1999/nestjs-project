import { BadRequestException, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/dto/common.dto';
import {
  CreatePrivateChatDto,
  GetListConversationResponseDto,
  GetPrivateConversationResponseDto,
} from 'src/dto/conversation.dto';
import { Conversation, User } from 'src/entities';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { ConversationRepository } from 'src/repository/conversation.repository';
import { UserRepository } from 'src/repository/user.repository';
import { CONVERSATION_TYPE, CONVERSATION_USER_ROLE } from 'src/types/global';
import { getPaginationData } from 'src/utils/common.utils';

@Injectable()
export class ConversationService {
  constructor(
    private userRepository: UserRepository,
    private conversationRepository: ConversationRepository,
    private conversationParticipantsRepository: ConversationParticipantRepository,
  ) {}

  async createPrivateChat(user: User, payload: CreatePrivateChatDto): Promise<Conversation> {
    const { partnerId } = payload;
    const user2 = await this.userRepository.findOneBy({ id: partnerId });
    if (!user2) throw new BadRequestException(`${partnerId} not found`);
    const hash =
      user.id < partnerId ? `1_1_${user.id}_${partnerId}` : `1_1_${partnerId}_${user.id}`;
    const findConversation = await this.conversationRepository.findOneBy({ hash });
    if (findConversation) throw new BadRequestException('Conversation is already exist');
    const newConversation = this.conversationRepository.create({
      type: CONVERSATION_TYPE.PRIVATE,
      name: '',
      hash,
    });
    const savedConversation = await this.conversationRepository.save(newConversation);
    if (!savedConversation) throw new BadRequestException('Create conversation failure!');
    const newParticipant1 = this.conversationParticipantsRepository.create({
      user: { id: user.id },
      conversation: { id: savedConversation.id },
      role: CONVERSATION_USER_ROLE.USER,
    });
    const savedParticipant1 = await this.conversationParticipantsRepository.save(newParticipant1);
    if (!savedParticipant1) throw new BadRequestException('Create conversation failure!');

    const newParticipant2 = this.conversationParticipantsRepository.create({
      user: { id: partnerId },
      conversation: { id: savedConversation.id },
      role: CONVERSATION_USER_ROLE.USER,
    });
    const savedParticipant2 = await this.conversationParticipantsRepository.save(newParticipant2);
    if (!savedParticipant2) throw new BadRequestException('Create conversation failure!');
    return savedConversation;
  }

  async getListConversations(
    user: User,
    params: PaginationQueryDto,
  ): Promise<GetListConversationResponseDto> {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const [participants, total] = await this.conversationParticipantsRepository.findAndCount({
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' },
      where: { user: { id: user.id } },
    });
    return {
      data: participants,
      metadata: getPaginationData(limit, participants.length, total, page),
    };
  }

  async getPrivateConversation(
    user: User,
    conversationId: number,
  ): Promise<GetPrivateConversationResponseDto> {
    const participants = await this.conversationParticipantsRepository.findBy({
      conversation: { id: conversationId },
    });
    if (participants.length != 2) throw new BadRequestException('Conversation is error');
    if (participants[0].user.id != user.id && participants[1].user.id != user.id)
      throw new BadRequestException();
    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId,
      type: CONVERSATION_TYPE.PRIVATE,
    });
    if (!conversation) throw new BadRequestException('Conversation not found');
    return { conversation };
  }
}
