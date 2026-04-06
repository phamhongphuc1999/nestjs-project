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
import { createClient, RedisClientType } from 'redis';
import { Server } from 'socket.io';
import { MICROSERVICE_EVENTS } from 'src/configs/enum.config';
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import { MessageRepository } from 'src/repository/message.repository';
import {
  AppSocket,
  JoinConversationPayload,
  MESSAGE_TYPE,
  SendMessagePayload,
  TypingMessagePayload,
} from 'src/types/global';
import { AppSocketUtil } from './app-socket.util';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsGateway.name);
  private redisClient?: RedisClientType;
  private redisPubClient?: RedisClientType;
  private redisSubClient?: RedisClientType;
  private readonly redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  constructor(
    private readonly participantsRepository: ConversationParticipantRepository,
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
      this.redisClient = createClient({ url: this.redisUrl });
      this.redisClient.on('error', (error) =>
        this.logger.warn(`Redis cache error: ${String(error)}`),
      );
      await this.redisClient.connect();

      this.redisPubClient = createClient({ url: this.redisUrl });
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
    client.emit(MICROSERVICE_EVENTS.joined, { conversationId });
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
      .emit(MICROSERVICE_EVENTS.typing_message, { conversationId, userId });
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
      .emit(MICROSERVICE_EVENTS.stop_typing, { conversationId, userId });
  }

  @SubscribeMessage(MICROSERVICE_EVENTS.send_message)
  async handleMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const conversationId = Number(data?.conversationId);
    if (!conversationId) throw new ForbiddenException('Conversation not found');
    const userId = AppSocketUtil.getUserId(client);

    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    const messageContent = (data?.message ?? '').trim();
    if (!messageContent) throw new BadRequestException('Message is empty');

    const newMessage = this.messageRepository.create({
      conversationId,
      senderId: userId,
      content: messageContent,
      type: MESSAGE_TYPE.TEXT,
    });
    const savedMessage = await this.messageRepository.save(newMessage);
    if (!savedMessage) throw new BadRequestException('Save message failure!');

    const payload = { conversationId, senderId: userId, message: messageContent };

    this.server
      .to(AppSocketUtil.conversationRoom(conversationId))
      .emit(MICROSERVICE_EVENTS.receive_message, payload);
    client.emit(MICROSERVICE_EVENTS.message_sent, payload);
  }
}
