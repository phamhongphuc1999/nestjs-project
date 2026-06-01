/**
 * Redis Cluster smoke test using `ioredis`.
 *
 * Install: npm install ioredis  /  bun add ioredis
 *
 * Run:
 *   CACHE_REDIS_URL=redis://localhost:6380,redis://localhost:6381,redis://localhost:6382 \
 *   npx ts-node -r tsconfig-paths/register src/scripts/redis-cache-test.ts
 */

import Redis, { Cluster } from 'ioredis';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const RAW_URLS =
  process.env.CACHE_REDIS_URL ||
  'redis://localhost:6380,redis://localhost:6381,redis://localhost:6382';

function parseUrl(url: string): { host: string; port: number } {
  const u = new URL(url);
  return { host: u.hostname, port: Number(u.port) };
}

const ROOT_NODES = RAW_URLS.split(',')
  .map((u) => u.trim())
  .filter(Boolean)
  .map(parseUrl);

// ---------------------------------------------------------------------------
// natMap: maps what the cluster announces (container hostname:6379)
//         back to what the host machine can actually reach (localhost:638x)
//
// Each node announces itself as e.g. "redis-master-1:6379" inside Docker.
// From the host, that resolves to localhost:6380 (via the published port).
// ioredis uses this map whenever it encounters a cluster-gossip address.
// ---------------------------------------------------------------------------
const natMap: Record<string, { host: string; port: number }> = {
  '172.20.0.11:6379': { host: 'localhost', port: 6380 },
  '172.20.0.12:6379': { host: 'localhost', port: 6381 },
  '172.20.0.13:6379': { host: 'localhost', port: 6382 },
  '172.20.0.21:6379': { host: 'localhost', port: 6383 },
  '172.20.0.22:6379': { host: 'localhost', port: 6384 },
  '172.20.0.23:6379': { host: 'localhost', port: 6385 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function pingNodes(nodes: { host: string; port: number }[]): Promise<void> {
  console.log('\n🔍 Pinging individual nodes...');
  for (const { host, port } of nodes) {
    const client = new Redis({ host, port, connectTimeout: 3_000, lazyConnect: true });
    try {
      await client.connect();
      const pong = await client.ping();
      console.log(`   ✅ ${host}:${port} → ${pong}`);
    } catch (err) {
      console.error(`   ❌ ${host}:${port} → UNREACHABLE:`, (err as Error).message);
      throw new Error(`Node ${host}:${port} is not reachable. Is the cluster running?`);
    } finally {
      client.disconnect();
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function redisTest() {
  console.log('🔧 Redis Cluster root nodes:');
  ROOT_NODES.forEach(({ host, port }) => console.log(`   • ${host}:${port}`));

  await pingNodes(ROOT_NODES);

  const cluster: Cluster = new Redis.Cluster(ROOT_NODES, {
    redisOptions: {
      connectTimeout: 5_000,
    },
    natMap,
    clusterRetryStrategy: (times) => Math.min(times * 100, 3_000),
    enableReadyCheck: true,
  });

  cluster.on('error', (err) => console.error('❌ [Redis Cluster Error]:', err));
  cluster.on('connect', () => console.log('\n🔌 Redis Cluster: Connecting...'));
  cluster.on('ready', () => console.log('✅ Redis Cluster: Ready!'));
  cluster.on('reconnecting', () => console.log('🔄 Redis Cluster: Reconnecting...'));

  try {
    await new Promise<void>((resolve, reject) => {
      cluster.once('ready', resolve);
      cluster.once('error', reject);
    });

    // ── Cluster health check ──────────────────────────────────────────────
    console.log('\n📊 Cluster info:');
    const rawInfo = await cluster.cluster('INFO');
    console.log('🚀 ~ redisTest ~ rawInfo:', rawInfo);
    const clusterState =
      rawInfo
        .split(/\r?\n/)
        .find((l) => l.startsWith('cluster_state'))
        ?.split(':')?.[1]
        ?.trim() ?? 'unknown';
    console.log(`   cluster_state: ${clusterState}`);
    if (clusterState !== 'ok') {
      throw new Error(`Cluster not healthy (state=${clusterState})`);
    }

    // ── SET / GET ─────────────────────────────────────────────────────────
    const strKey = 'test:string:key1';
    const strValue = `hello-${Date.now()}`;
    console.log(`\n📝 SET  "${strKey}" = "${strValue}"`);
    await cluster.set(strKey, strValue, 'EX', 60);
    const fetched = await cluster.get(strKey);
    console.log(`📖 GET  "${strKey}" → "${fetched}"`);
    if (fetched !== strValue) throw new Error('GET returned unexpected value!');
    console.log('   ✅ SET/GET OK');

    // ── SADD / SMEMBERS ───────────────────────────────────────────────────
    const setKey = 'test:set:key1';
    console.log(`\n📝 SADD "${setKey}" "value1"`);
    const added = await cluster.sadd(setKey, 'value1');
    console.log(`   Result: ${added > 0 ? 'New element added ✅' : 'Already existed ✅'}`);
    const members = await cluster.smembers(setKey);
    console.log(`📖 SMEMBERS "${setKey}" → [${members.join(', ')}]`);

    // ── INCR ──────────────────────────────────────────────────────────────
    const ctrKey = 'test:counter';
    const count = await cluster.incr(ctrKey);
    console.log(`\n🔢 INCR "${ctrKey}" → ${count} ✅`);

    // ── cleanup ───────────────────────────────────────────────────────────
    await Promise.all([cluster.del(strKey), cluster.del(setKey), cluster.del(ctrKey)]);

    console.log('\n🧹 Test keys cleaned up.');
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n💥 Critical error during test execution:');
    console.error(error);
    process.exitCode = 1;
  } finally {
    console.log('\n🛑 Closing cluster connection...');
    cluster.disconnect();
    console.log('👋 Script finished.');
  }
}

redisTest().catch((error) => {
  console.error(error);
  process.exit(1);
});
