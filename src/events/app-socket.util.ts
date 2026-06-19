import { UnauthorizedException } from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';
import { AppConfigs } from 'src/configs/app.config';
import { AppSocket, TOKEN_TYPE } from 'src/types/global';
import { parseUrl } from 'src/utils/common.utils';
import { verifyToken } from 'src/utils/jwt';

// ---------------------------------------------------------------------------
// clusterNatMap: maps what the cluster announces (container hostname:6379)
//         back to what the host machine can actually reach (localhost:638x)
//
// Each node announces itself as e.g. "redis-master-1:6379" inside Docker.
// From the host, that resolves to localhost:6380 (via the published port).
// ioredis uses this map whenever it encounters a cluster-gossip address.
// ---------------------------------------------------------------------------
const clusterNatMap: Record<string, { host: string; port: number }> = {
  '172.20.0.11:6379': { host: 'localhost', port: 6380 },
  '172.20.0.12:6379': { host: 'localhost', port: 6381 },
  '172.20.0.13:6379': { host: 'localhost', port: 6382 },
  '172.20.0.21:6379': { host: 'localhost', port: 6383 },
  '172.20.0.22:6379': { host: 'localhost', port: 6384 },
  '172.20.0.23:6379': { host: 'localhost', port: 6385 },
};

async function pingNodes(nodes: { host: string; port: number }[]): Promise<void> {
  console.log('\n🔍 Pinging individual nodes...');
  for (const { host, port } of nodes) {
    const client = new Redis({ host, port, connectTimeout: 3_000, lazyConnect: true });
    try {
      await client.connect();
      const pong = await client.ping();
      console.log(`✅ ${host}:${port} → ${pong}`);
    } catch (err) {
      console.error(`❌ ${host}:${port} → UNREACHABLE:`, (err as Error).message);
      throw new Error(`Node ${host}:${port} is not reachable. Is the cluster running?`);
    } finally {
      client.disconnect();
    }
  }
}

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

  static async createCluster() {
    const rootNodes = AppConfigs.CACHE_REDIS_URL.split(',')
      .map((u) => u.trim())
      .filter(Boolean)
      .map(parseUrl);
    rootNodes.forEach(({ host, port }) => console.log(`   • ${host}:${port}`));
    await pingNodes(rootNodes);
    const cluster: Cluster = new Redis.Cluster(rootNodes, {
      redisOptions: { connectTimeout: 5_000 },
      natMap: clusterNatMap,
      clusterRetryStrategy: (times) => Math.min(times * 100, 3_000),
      enableReadyCheck: true,
    });
    return cluster;
  }
}
