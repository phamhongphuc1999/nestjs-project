/**
 * Redis Sentinel smoke test using `ioredis`.
 *
 * Tests:
 *  1. Sentinel connectivity  — all 3 sentinels respond
 *  2. Master discovery       — sentinels agree on who is master
 *  3. Replication health     — master reports 2 connected replicas
 *  4. SET / GET              — basic read-write on master
 *  5. Pub/Sub                — PUBLISH on one connection, SUBSCRIBE on another
 *  6. Pattern Pub/Sub        — PSUBSCRIBE with wildcard pattern
 *  7. Failover simulation    — DEBUG SLEEP forces sentinel to elect new master
 *
 * Install: npm install ioredis  /  bun add ioredis
 *
 * Run:
 *   REDIS_PUBSUB_PASSWORD=redispassword@123 \
 *   npx ts-node src/scripts/redis-sentinel-test.ts
 *
 * Enable failover test (takes ~12s):
 *   TEST_FAILOVER=true REDIS_PUBSUB_PASSWORD=... npx ts-node ...
 */

import Redis from 'ioredis';
import { AppConfigs } from 'src/configs/app.config';
import {
  createDirectClient,
  resolveMaster,
  SENTINELS,
  testMasterDiscovery,
  testSentinelConnectivity,
  waitReady,
} from 'src/events/redis-sentinel.util';
import { sleep } from 'src/utils/common.utils';

// ─── Test 3: Replication health ───────────────────────────────────────────────

async function testReplicationHealth(client: Redis): Promise<void> {
  console.log('\n━━━ Test 3: Replication health ━━━');

  const info = await client.info('replication');
  const parse = (key: string) =>
    info
      .split(/\r?\n/)
      .find((l) => l.startsWith(key))
      ?.split(':')?.[1]
      ?.trim() ?? 'unknown';

  const role = parse('role');
  const replicas = parseInt(parse('connected_slaves'), 10);

  console.log(`  role               : ${role}`);
  console.log(`  connected_replicas : ${replicas}`);

  if (role !== 'master') throw new Error(`Expected role=master, got "${role}"`);
  if (replicas < 2) throw new Error(`Expected ≥2 replicas, got ${replicas}`);

  console.log('  ✅ Replication OK');
}

// ─── Test 4: SET / GET ────────────────────────────────────────────────────────

async function testSetGet(client: Redis): Promise<void> {
  console.log('\n━━━ Test 4: SET / GET ━━━');

  const key = `sentinel:test:${Date.now()}`;
  const value = `hello-${Date.now()}`;

  await client.set(key, value, 'EX', 60);
  const fetched = await client.get(key);
  await client.del(key);

  console.log(`  SET/GET "${key}" → "${fetched}"`);
  if (fetched !== value) throw new Error(`Mismatch: expected "${value}", got "${fetched}"`);
  console.log('  ✅ SET/GET OK');
}

// ─── Test 5: Pub/Sub ──────────────────────────────────────────────────────────

async function testPubSub(): Promise<void> {
  console.log('\n━━━ Test 5: Pub/Sub ━━━');

  const subscriber = await createDirectClient('sub');
  const publisher = await createDirectClient('pub');

  const CHANNEL = `sentinel:pubsub:${Date.now()}`;
  const PAYLOAD = JSON.stringify({ event: 'smoke-test', ts: Date.now() });

  try {
    const received = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Pub/Sub timeout (5s)')), 5_000);

      void subscriber.subscribe(CHANNEL, (err) => {
        if (err) {
          clearTimeout(timer);
          reject(err);
        }
      });

      subscriber.on('message', (ch, msg) => {
        if (ch === CHANNEL) {
          clearTimeout(timer);
          resolve(msg);
        }
      });
    });

    await sleep(300); // let SUBSCRIBE propagate

    const count = await publisher.publish(CHANNEL, PAYLOAD);
    console.log(`  PUBLISH → ${count} receiver(s)`);
    if (count === 0) throw new Error('0 receivers — subscriber not connected?');

    const msg = await received;
    if (msg !== PAYLOAD) throw new Error(`Payload mismatch: "${msg}"`);
    console.log(`  MESSAGE: ${msg}`);
    console.log('  ✅ Pub/Sub OK');
  } finally {
    subscriber.disconnect();
    publisher.disconnect();
  }
}

// ─── Test 6: Pattern Pub/Sub ──────────────────────────────────────────────────

async function testPatternPubSub(): Promise<void> {
  console.log('\n━━━ Test 6: Pattern Pub/Sub (PSUBSCRIBE) ━━━');

  const subscriber = await createDirectClient('psub');
  const publisher = await createDirectClient('ppub');

  const PATTERN = 'sentinel:events:*';
  const CHANNEL = `sentinel:events:order:${Date.now()}`;
  const PAYLOAD = JSON.stringify({ orderId: 42, status: 'paid' });

  try {
    const received = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('PSUBSCRIBE timeout (5s)')), 5_000);

      void subscriber.psubscribe(PATTERN, (err) => {
        if (err) {
          clearTimeout(timer);
          reject(err);
        }
      });

      subscriber.on('pmessage', (_pat, ch, msg) => {
        if (ch === CHANNEL) {
          clearTimeout(timer);
          resolve(msg);
        }
      });
    });

    await sleep(300);

    const count = await publisher.publish(CHANNEL, PAYLOAD);
    console.log(`  PUBLISH "${CHANNEL}" → ${count} receiver(s)`);

    const msg = await received;
    if (msg !== PAYLOAD) throw new Error('Pattern payload mismatch');
    console.log(`  MESSAGE: ${msg}`);
    console.log('  ✅ Pattern Pub/Sub OK');
  } finally {
    subscriber.disconnect();
    publisher.disconnect();
  }
}

// ─── Test 7: Failover ────────────────────────────────────────────────────────

async function testFailover(): Promise<void> {
  console.log('\n━━━ Test 7: Failover simulation ━━━');

  const { host, port } = await resolveMaster();
  console.log(`  Current master: ${host}:${port}`);
  console.log('  Sending DEBUG SLEEP 15 → master becomes unresponsive...');

  // Use lazyConnect here — we only need a one-shot fire-and-forget command.
  const direct = new Redis({
    host,
    port,
    password: AppConfigs.STREAM_REDIS_PASSWORD,
    connectTimeout: 3_000,
    lazyConnect: true,
  });
  try {
    await direct.connect();
    void direct.debug('sleep', '15').catch(() => {
      /* expected disconnect */
    });
  } finally {
    direct.disconnect();
  }

  console.log('  Waiting 12s for sentinel to elect new master...');
  await sleep(12_000);

  const newMaster = await resolveMaster();
  console.log(`  New master: ${newMaster.host}:${newMaster.port}`);

  const client = new Redis({
    ...newMaster,
    password: AppConfigs.STREAM_REDIS_PASSWORD,
    connectTimeout: 5_000,
  });
  try {
    await waitReady(client);

    const info = await client.info('replication');
    const role = info
      .split(/\r?\n/)
      .find((l) => l.startsWith('role'))
      ?.split(':')?.[1]
      ?.trim();

    if (role !== 'master') throw new Error(`New node role is "${role}", expected "master"`);

    const key = `sentinel:failover:${Date.now()}`;
    await client.set(key, 'ok', 'EX', 30);
    const val = await client.get(key);
    await client.del(key);
    if (val !== 'ok') throw new Error('Write verify failed after failover');

    console.log('  ✅ Failover OK — new master elected and writable');
  } finally {
    client.disconnect();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Redis Sentinel Smoke Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Master name : ${AppConfigs.MASTER_NAME}`);
  console.log(`  Sentinels   : ${SENTINELS.map((s) => `${s.host}:${s.port}`).join(', ')}`);
  console.log('═══════════════════════════════════════════════════════');

  let client: Redis | null = null;

  try {
    await testSentinelConnectivity();
    await testMasterDiscovery();

    console.log('\n🔌 Connecting to master...');
    client = await createDirectClient('main');
    console.log('  ✅ Connected');

    await testReplicationHealth(client);
    await testSetGet(client);
    await testPubSub();
    await testPatternPubSub();

    if (process.env.TEST_FAILOVER === 'true') {
      await testFailover();
    } else {
      console.log('\n━━━ Test 7: Failover simulation ━━━');
      console.log('  ⏭  Skipped (set TEST_FAILOVER=true to enable, takes ~12s)');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  🎉 All tests passed!');
    console.log('═══════════════════════════════════════════════════════');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('  💥 Test failed:', (error as Error).message);
    console.error('═══════════════════════════════════════════════════════');
    process.exitCode = 1;
  } finally {
    client?.disconnect();
    console.log('\n👋 Done.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
