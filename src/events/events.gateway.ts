import { ForbiddenException, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
import { AppSocket, JoinConversationPayload, SendMessagePayload } from 'src/types/global';
import { AppSocketUtil } from './app-socket.util';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsGateway.name);
  private redisClient?: RedisClientType;
  private redisPubClient?: RedisClientType;
  private redisSubClient?: RedisClientType;
  private readonly redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  constructor(
    private readonly conversationParticipantsRepository: ConversationParticipantRepository,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    if (this.redisPubClient && this.redisSubClient) {
      server.adapter(createAdapter(this.redisPubClient, this.redisSubClient));
    }
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

    const participant = await this.conversationParticipantsRepository.findOne({
      select: { id: true },
      where: { conversation: { id: conversationId }, user: { id: userId } },
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
    this.logger.log(
      `join_conversation received: socket=${client.id} conversationId=${conversationId}`,
    );
    if (!conversationId) throw new ForbiddenException('Conversation not found');
    const userId = AppSocketUtil.getUserId(client);
    this.logger.log(`join_conversation userId=${userId} conversationId=${conversationId}`);

    const isParticipant = await this.isParticipant(conversationId, userId);
    this.logger.log(`join_conversation isParticipant=${isParticipant}`);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    await client.join(AppSocketUtil.conversationRoom(conversationId));
    this.logger.log(`join_conversation success: userId=${userId} conversationId=${conversationId}`);
    client.emit(MICROSERVICE_EVENTS.joined, { conversationId });
  }

  @SubscribeMessage(MICROSERVICE_EVENTS.send_message)
  async handleMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    this.logger.log(`send_message received: socket=${client.id} data=${JSON.stringify(data)}`);
    const conversationId = Number(data?.conversationId);
    if (!conversationId) throw new ForbiddenException('Conversation not found');
    const userId = AppSocketUtil.getUserId(client);

    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    const payload = { conversationId, senderId: userId, message: data?.message ?? '' };

    this.server
      .to(AppSocketUtil.conversationRoom(conversationId))
      .emit(MICROSERVICE_EVENTS.receive_message, payload);
    this.logger.log(`send_message success: userId=${userId} conversationId=${conversationId}`);
    client.emit(MICROSERVICE_EVENTS.message_sent, payload);
  }
}
