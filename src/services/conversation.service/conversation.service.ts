import { BadRequestException, Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/dto/common.dto';
import {
  ConversationListItemDto,
  CreatePrivateChatDto,
  GetListConversationResponseDto,
} from 'src/dto/conversation.dto';
import { Conversation, User } from 'src/entities';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { ConversationRepository } from 'src/repository/conversation.repository';
import { UserRepository } from 'src/repository/user.repository';
import { CONVERSATION_TYPE, CONVERSATION_USER_ROLE } from 'src/types/global';
import { getPaginationData } from 'src/utils/common.utils';
import { In, Not } from 'typeorm';

@Injectable()
export class ConversationService {
  constructor(
    private userRepository: UserRepository,
    private conversationRepository: ConversationRepository,
    private conversationParticipantsRepository: ConversationParticipantRepository,
  ) {}

  async createPrivateChat(user: User, payload: CreatePrivateChatDto): Promise<Conversation> {
    const { partnerId } = payload;
    if (partnerId == user.id) throw new BadRequestException('Two users is a same person');
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
      order: { createdAt: 'DESC', id: 'DESC' },
      relations: { conversation: true },
      where: { user: { id: user.id } },
    });
    const privateConversationIds = participants
      .filter((participant) => participant.conversation?.type === CONVERSATION_TYPE.PRIVATE)
      .map((participant) => participant.conversation.id);

    if (privateConversationIds.length > 0) {
      const otherParticipants = await this.conversationParticipantsRepository.find({
        where: { conversation: { id: In(privateConversationIds) }, user: { id: Not(user.id) } },
        relations: { user: true },
      });
      const otherParticipantsMap = new Map(
        otherParticipants.map((participant) => [participant.conversationId, participant]),
      );
      const data: Array<ConversationListItemDto> = participants.map((participant) => {
        const coreData: ConversationListItemDto = {
          conversationId: participant.conversationId,
          conversationName: participant.conversation.name,
          createdAt: participant.createdAt,
          deletedAt: participant.deletedAt,
          id: participant.id,
          role: participant.role,
          updatedAt: participant.updatedAt,
          groupType: participant.conversation.type,
          yourParticipant: { id: participant.userId, name: user.name, email: user.email },
        };
        if (participant.conversation.type == CONVERSATION_TYPE.PRIVATE) {
          const anotherParticipant = otherParticipantsMap.get(participant.conversation.id);
          return anotherParticipant
            ? {
                ...coreData,
                anotherParticipant: {
                  id: anotherParticipant.user.id,
                  name: anotherParticipant.user.name,
                  email: anotherParticipant.user.email,
                },
              }
            : coreData;
        }
        return coreData;
      });
      return { data, metadata: getPaginationData(limit, data.length, total, page) };
    }
    const data: Array<ConversationListItemDto> = participants.map((participant) => {
      return {
        conversationId: participant.conversationId,
        conversationName: participant.conversation.name,
        createdAt: participant.createdAt,
        deletedAt: participant.deletedAt,
        id: participant.id,
        role: participant.role,
        updatedAt: participant.updatedAt,
        groupType: participant.conversation.type,
        yourParticipant: { id: participant.userId, name: user.name, email: user.email },
      };
    });
    return { data, metadata: getPaginationData(limit, data.length, total, page) };
  }
}
