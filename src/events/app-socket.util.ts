import { UnauthorizedException } from '@nestjs/common';
import { AppSocket, TOKEN_TYPE } from 'src/types/global';
import { verifyToken } from 'src/utils/jwt';

export class AppSocketUtil {
  static conversationRoom(conversationId: number): string {
    return `conversation:${conversationId}`;
  }

  private static extractToken(client: AppSocket): string | null {
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

  static getUserId(client: AppSocket): number {
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
}
