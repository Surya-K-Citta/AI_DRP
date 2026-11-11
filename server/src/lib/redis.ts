// @ts-nocheck
import Redis from 'ioredis';

// Optional shared state for running several API servers: rate limits and the account-status cache.
// Without REDIS_URL everything stays in each server's memory, exactly as before. A Redis outage never blocks a request:
// callers fall back to memory, and the client reconnects in the background.
let client: any = null;
let created = false;
let lastError: string | null = null;

export function getRedis(): any | null {
  if (created) return client;
  created = true;
  const url = (process.env.REDIS_URL || '').trim();
  if (!url) return null;
  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy: (times: number) => Math.min(times * 500, 10_000),
    ...(url.startsWith('rediss://') ? { tls: {} } : {}),
  });
  client.on('error', (err: Error) => {
    if (lastError !== err.message) console.warn(`[redis] ${err.message}`);
    lastError = err.message;
  });
  client.on('ready', () => { lastError = null; });
  return client;
}

export function redisReady(): boolean {
  const c = getRedis();
  return !!c && c.status === 'ready';
}

export function redisStatus() {
  return { configured: !!(process.env.REDIS_URL || '').trim() || !!client, ready: redisReady(), lastError };
}

export function setRedisForTests(fake: any | null) {
  client = fake;
  created = true;
  lastError = null;
}
