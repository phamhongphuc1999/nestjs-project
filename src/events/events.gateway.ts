import {
  BadRequestException,
  ForbiddenException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, createCluster, RedisClientType, RedisClusterType } from 'redis';
import { Server } from 'socket.io';
import { AppConfigs } from 'src/configs/app.config';
import { MICROSERVICE_EVENTS } from 'src/configs/enum.config';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { ConversationRepository } from 'src/repository/conversation.repository';
import { MessageRepository } from 'src/repository/message.repository';
import {
  AppSocket,
  EditMessagePayload,
  JoinConversationPayload,
  MESSAGE_TYPE,
  SendMessagePayload,
  TypingMessagePayload,
} from 'src/types/global';
import { AppSocketUtil } from './app-socket.util';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsGateway.name);
  private redisClient?: RedisClusterType;
  private redisPubClient?: RedisClientType;
  private redisSubClient?: RedisClientType;

  constructor(
    private readonly participantsRepository: ConversationParticipantRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    if (this.redisPubClient && this.redisSubClient)
      server.adapter(createAdapter(this.redisPubClient, this.redisSubClient));
  }

  async onModuleInit() {
    try {
      this.redisClient = createCluster({
        rootNodes: AppConfigs.CACHE_REDIS_URL.map((url) => {
          return { url };
        }),
      });
      this.redisClient.on('error', (error) =>
        this.logger.warn(`Redis cache error: ${String(error)}`),
      );
      await this.redisClient.connect();

      this.redisPubClient = createClient({ url: AppConfigs.STREAM_REDIS_URL });
      this.redisSubClient = this.redisPubClient.duplicate();
      this.redisPubClient.on('error', (error) =>
        this.logger.warn(`Redis pub error: ${String(error)}`),
      );
      this.redisSubClient.on('error', (error) =>
        this.logger.warn(`Redis sub error: ${String(error)}`),
      );
      await Promise.all([this.redisPubClient.connect(), this.redisSubClient.connect()]);
    } catch (error) {
      this.logger.warn(
        `Redis unavailable, socket will work without cache/adapter: ${(error as Error).message}`,
      );
      this.redisClient = undefined;
      this.redisPubClient = undefined;
      this.redisSubClient = undefined;
    }
  }

  onModuleDestroy() {
    this.redisClient?.destroy();
    this.redisPubClient?.destroy();
    this.redisSubClient?.destroy();
  }

  private async isParticipant(conversationId: number, userId: number): Promise<boolean> {
    const cacheKey = `conversation:${conversationId}:participants`;
    if (this.redisClient) {
      const cached = await this.redisClient.sIsMember(cacheKey, String(userId));
      if (cached) return true;
    }

    const participant = await this.participantsRepository.findOne({
      select: { id: true },
      where: { conversationId, userId },
    });

    if (participant && this.redisClient) {
      await this.redisClient.sAdd(cacheKey, String(userId));
      await this.redisClient.expire(cacheKey, 300);
    }
    return !!participant;
  }

  /** Auto-join user to all their conversation rooms when socket connects */
  async handleConnection(client: AppSocket) {
    try {
      const userId = AppSocketUtil.getUserId(client);
      const participantRecords = await this.participantsRepository.find({
        where: { userId },
        select: { conversationId: true },
      });
      for (const record of participantRecords) {
        await client.join(AppSocketUtil.conversationRoom(record.conversationId));
      }
      this.logger.debug(`Socket ${client.id} auto-joined ${participantRecords.length} rooms`);
    } catch {
      // Socket will fail auth on first subscribe if token is invalid
    }
  }

  @SubscribeMessage(MICROSERVICE_EVENTS.join_conversation)
  async handleJoin(
    @MessageBody() data: JoinConversationPayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const conversationId = Number(data?.conversationId);
    if (!conversationId) throw new ForbiddenException('Conversation not found');
    const userId = AppSocketUtil.getUserId(client);

    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    await client.join(AppSocketUtil.conversationRoom(conversationId));
    client.emit(MICROSERVICE_EVENTS.joined_conversation, { conversationId });
  }

  @SubscribeMessage(MICROSERVICE_EVENTS.typing_message)
  async typingMessage(
    @MessageBody() data: TypingMessagePayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const conversationId = Number(data.conversationId);
    if (!conversationId) throw new ForbiddenException('Conversation not found');
    const userId = AppSocketUtil.getUserId(client);
    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) return;

    client
      .to(AppSocketUtil.conversationRoom(conversationId))
      .emit(MICROSERVICE_EVENTS.typing_message, { conversationId, senderId: userId });
  }

  @SubscribeMessage(MICROSERVICE_EVENTS.stop_typing)
  async handleStopTyping(
    @MessageBody() data: TypingMessagePayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const conversationId = Number(data?.conversationId);
    const userId = AppSocketUtil.getUserId(client);
    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) return;

    client
      .to(AppSocketUtil.conversationRoom(conversationId))
      .emit(MICROSERVICE_EVENTS.stop_typing, { conversationId, senderId: userId });
  }

  @SubscribeMessage(MICROSERVICE_EVENTS.send_message)
  async handleMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const { conversationId, content } = data;
    const userId = AppSocketUtil.getUserId(client);

    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    const messageContent = (content ?? '').trim();
    if (!messageContent) throw new BadRequestException('Message is empty');

    const newMessage = this.messageRepository.create({
      conversationId,
      senderId: userId,
      content: messageContent,
      type: MESSAGE_TYPE.TEXT,
    });
    const savedMessage = await this.messageRepository.save(newMessage);
    if (!savedMessage) throw new BadRequestException('Save message failure!');

    // Update conversation metadata for last message & activity
    await this.conversationRepository.update(conversationId, {
      lastMessageId: savedMessage.id,
      lastActivityAt: new Date(),
    });

    const payload = {
      id: savedMessage.id,
      conversationId,
      senderId: userId,
      content: messageContent,
      type: savedMessage.type,
      replyToId: savedMessage.replyToId,
    };

    client.broadcast
      .to(AppSocketUtil.conversationRoom(conversationId))
      .emit(MICROSERVICE_EVENTS.receive_message, payload);
    client.emit(MICROSERVICE_EVENTS.message_sent, payload);
  }

  @SubscribeMessage(MICROSERVICE_EVENTS.edit_message)
  async handleEditMessage(
    @MessageBody() data: EditMessagePayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const { conversationId, content } = data;
    const userId = AppSocketUtil.getUserId(client);
    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    const messageContent = (content ?? '').trim();
    if (!messageContent) throw new BadRequestException('Message is empty');
    const oldMessage = await this.messageRepository.findOneBy({ id: data.messageId });
    if (oldMessage?.content != messageContent) {
      await this.messageRepository.update(
        { id: data.messageId },
        { content: messageContent, type: MESSAGE_TYPE.EDIT_TEXT },
      );
      const payload = {
        id: data.messageId,
        conversationId,
        senderId: userId,
        editedContent: messageContent,
      };
      client.broadcast
        .to(AppSocketUtil.conversationRoom(conversationId))
        .emit(MICROSERVICE_EVENTS.notify_edited_message, payload);
      client.emit(MICROSERVICE_EVENTS.message_edited, payload);
    }
  }
}
