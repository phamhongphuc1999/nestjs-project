import {
  ForbiddenException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
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
import { ConversationParticipantRepository } from 'src/repository/conversation-participants.repository';
import {
  AppSocket,
  JoinConversationPayload,
  SendMessagePayload,
  TOKEN_TYPE,
} from 'src/types/global';
import { verifyToken } from 'src/utils/jwt';

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

  private conversationRoom(conversationId: number): string {
    return `conversation:${conversationId}`;
  }

  private extractToken(client: AppSocket): string | null {
    const auth = (client.handshake?.auth ?? {}) as Record<string, unknown>;
    const authToken = auth['token'];
    if (typeof authToken === 'string' && authToken.length > 0) return authToken;
    const rawHeader = client.handshake?.headers?.authorization as unknown;
    let value: string | null = null;
    if (typeof rawHeader === 'string') value = rawHeader;
    else if (Array.isArray(rawHeader) && typeof rawHeader[0] === 'string') value = rawHeader[0];
    if (!value) return null;
    const [type, token] = value.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !token) return null;
    return token;
  }

  private getUserId(client: AppSocket): number {
    const existing = client.data?.userId;
    if (typeof existing === 'number' && existing > 0) return existing;
    const token = this.extractToken(client);
    if (!token) throw new UnauthorizedException('Token is incorrect');
    const decodedToken = verifyToken(TOKEN_TYPE.ACCESS_TOKEN, token);
    const id = Number(decodedToken?.sub);
    if (!id) throw new UnauthorizedException('Cannot decode token');
    client.data.userId = id;
    return id;
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

  @SubscribeMessage('join_conversation')
  async handleJoin(
    @MessageBody() data: JoinConversationPayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const conversationId = Number(data?.conversationId);
    if (!conversationId) throw new ForbiddenException('Conversation not found');
    const userId = this.getUserId(client);

    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    await client.join(this.conversationRoom(conversationId));
    return { event: 'joined', data: { conversationId } };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: AppSocket,
  ) {
    const conversationId = Number(data?.conversationId);
    if (!conversationId) throw new ForbiddenException('Conversation not found');
    const userId = this.getUserId(client);

    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) throw new ForbiddenException('User is not a participant');

    const payload = {
      conversationId,
      senderId: userId,
      message: data?.message ?? '',
    };

    this.server.to(this.conversationRoom(conversationId)).emit('receive_message', payload);
    return { event: 'message_sent', data: payload };
  }
}
