/**
 * Redis Cluster smoke test using `ioredis`.
 *
 * Install: npm install ioredis  /  bun add ioredis
 *
 * Run:
 *   CACHE_REDIS_URL=redis://localhost:6380,redis://localhost:6381,redis://localhost:6382 \
 *   npx ts-node -r tsconfig-paths/register src/scripts/redis-cache-test.ts
 */

import { AppSocketUtil } from 'src/events/app-socket.util';

async function redisTest() {
  console.log('🔧 Redis Cluster root nodes:');
  const cluster = await AppSocketUtil.createCluster();

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
