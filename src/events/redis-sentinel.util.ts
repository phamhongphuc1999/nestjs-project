import Redis from 'ioredis';
import { AppConfigs } from 'src/configs/app.config';

export const SENTINELS = [
  { host: 'localhost', port: 26390 },
  { host: 'localhost', port: 26391 },
  { host: 'localhost', port: 26392 },
];

// Maps Docker-internal IPs → localhost published ports.
const NAT_MAP: Record<string, { host: string; port: number }> = {
  '172.20.1.11:6379': { host: 'localhost', port: 6390 },
  '172.20.1.21:6379': { host: 'localhost', port: 6391 },
  '172.20.1.22:6379': { host: 'localhost', port: 6392 },
};

/**
 * Wait for a client to become ready.
 * Checks status first to avoid missing events that fired before we subscribed.
 */
export function waitReady(client: Redis, timeoutMs = 8_000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (client.status === 'ready') {
      resolve();
      return;
    }

    const timer = setTimeout(
      () => reject(new Error('Timeout: client did not become ready')),
      timeoutMs,
    );

    const onReady = () => {
      clearTimeout(timer);
      client.off('error', onError);
      resolve();
    };

    const onError = (err: Error) => {
      clearTimeout(timer);
      client.off('ready', onReady);
      reject(err);
    };

    client.once('ready', onReady);
    client.once('error', onError);
  });
}

/**
 * Open a one-shot connection to a sentinel (no auth needed).
 * Uses lazyConnect so we control exactly when to connect/disconnect.
 */
async function openSentinel(host: string, port: number): Promise<Redis> {
  const client = new Redis({ host, port, connectTimeout: 3_000, lazyConnect: true });
  await client.connect();
  return client;
}

/**
 * Ask sentinels for the current master address and translate via NAT_MAP.
 */
export async function resolveMaster(): Promise<{ host: string; port: number }> {
  let lastErr: Error | undefined;

  for (const s of SENTINELS) {
    const raw = await openSentinel(s.host, s.port).catch((e: unknown) => {
      lastErr = e instanceof Error ? e : new Error(String(e));
      return null;
    });
    if (!raw) continue;

    try {
      const result = (await raw.call(
        'SENTINEL',
        'get-master-addr-by-name',
        AppConfigs.MASTER_NAME,
      )) as string[] | null;

      if (result && result.length >= 2) {
        const internalAddr = `${result[0]}:${result[1]}`;
        return NAT_MAP[internalAddr] ?? { host: result[0], port: parseInt(result[1], 10) };
      }
    } catch (err) {
      lastErr = err as Error;
    } finally {
      raw.disconnect();
    }
  }

  throw new Error(`Could not resolve master from any sentinel. Last error: ${lastErr?.message}`);
}

/**
 * Create a plain Redis client connected directly to the current master.
 *
 * Key fix: do NOT use lazyConnect here. Let ioredis connect immediately so
 * the 'ready' event fires naturally and waitReady() can catch it reliably.
 */
export async function createDirectClient(label = 'client'): Promise<Redis> {
  const { host, port } = await resolveMaster();
  console.log(`  → [${label}] Connecting to master at ${host}:${port}`);

  const client = new Redis({
    host,
    port,
    password: AppConfigs.STREAM_REDIS_PASSWORD,
    connectTimeout: 5_000,
    // No lazyConnect — ioredis connects immediately; waitReady handles the event.
  });

  // Suppress unhandled error events during setup; we surface them via waitReady.
  client.on('error', () => {});
  await waitReady(client);

  // Re-register a proper error logger after connection is stable.
  client.removeAllListeners('error');
  client.on('error', (err) => console.error(`  [${label} error]`, err.message));

  return client;
}

export async function testSentinelConnectivity(): Promise<void> {
  console.log('\n━━━ Test 1: Sentinel connectivity ━━━');

  for (const { host, port } of SENTINELS) {
    const raw = await openSentinel(host, port);
    try {
      const pong = await raw.ping();
      console.log(`  ✅ sentinel ${host}:${port} → ${pong}`);
    } catch (err) {
      throw new Error(`Sentinel ${host}:${port} unreachable: ${(err as Error).message}`);
    } finally {
      raw.disconnect();
    }
  }
}

export async function testMasterDiscovery(): Promise<void> {
  console.log('\n━━━ Test 2: Master discovery ━━━');

  const votes = new Map<string, number>();

  for (const { host, port } of SENTINELS) {
    const raw = await openSentinel(host, port);
    try {
      const masters = (await raw.call('SENTINEL', 'masters')) as string[][];
      for (const m of masters) {
        const obj: Record<string, string> = {};
        for (let i = 0; i < m.length; i += 2) obj[m[i]] = m[i + 1];
        console.log(
          `  sentinel ${host}:${port} → master="${obj['name']}" ` +
            `ip=${obj['ip']}:${obj['port']} flags=${obj['flags']}`,
        );
      }

      const result = (await raw.call(
        'SENTINEL',
        'get-master-addr-by-name',
        AppConfigs.MASTER_NAME,
      )) as string[] | null;

      if (!result || result.length < 2) {
        throw new Error(
          `Sentinel ${host}:${port} could not resolve master "${AppConfigs.MASTER_NAME}"`,
        );
      }

      const addr = `${result[0]}:${result[1]}`;
      votes.set(addr, (votes.get(addr) ?? 0) + 1);
      console.log(`  ✅ sentinel ${host}:${port} → master = ${addr}`);
    } finally {
      raw.disconnect();
    }
  }

  if (votes.size !== 1) {
    throw new Error(`Sentinels disagree on master: ${JSON.stringify(Object.fromEntries(votes))}`);
  }

  const [[addr, count]] = votes.entries();
  const mapped = NAT_MAP[addr];
  console.log(`  ✅ All ${count} sentinels agree: ${addr} → host ${mapped?.host}:${mapped?.port}`);
}

export async function createSteamClients() {
  let subscriber: Redis | null = null;
  let publisher: Redis | null = null;
  try {
    await testSentinelConnectivity();
    await testMasterDiscovery();
    subscriber = await createDirectClient('sub');
    publisher = await createDirectClient('pub');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('  💥 Test failed:', (error as Error).message);
    console.error('═══════════════════════════════════════════════════════');
    process.exitCode = 1;
  } finally {
    subscriber?.disconnect();
    publisher?.disconnect();
    console.log('\n👋 Done.');
  }
  return { subscriber, publisher };
}
