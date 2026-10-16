// @ts-nocheck
import { MemoryStore } from 'express-rate-limit';
import { getRedis, redisReady } from './redis';

/**
 * express-rate-limit store that counts in Redis, so every API server shares one count per client.
 * If Redis is not configured or not reachable, the call is counted in this server's memory instead.
 */
export class RedisRateLimitStore {
  private windowMs = 60_000;
  private readonly fallback = new MemoryStore();
  private readonly prefix: string;
  constructor(prefix = 'rl:') {
    this.prefix = prefix;
  }

  init(options: { windowMs: number }) {
    this.windowMs = options.windowMs;
    this.fallback.init?.(options);
  }

  async increment(key: string) {
    if (!redisReady()) return this.fallback.increment(key);
    const redis = getRedis();
    try {
      const k = this.prefix + key;
      const totalHits = await redis.incr(k);
      let ttl = totalHits === 1 ? -1 : await redis.pttl(k);
      if (totalHits === 1 || ttl < 0) {
        await redis.pexpire(k, this.windowMs); // also repairs a counter that lost its expiry
        ttl = this.windowMs;
      }
      return { totalHits, resetTime: new Date(Date.now() + ttl) };
    } catch {
      return this.fallback.increment(key);
    }
  }

  async decrement(key: string) {
    if (!redisReady()) return this.fallback.decrement(key);
    try { await getRedis().decr(this.prefix + key); } catch { await this.fallback.decrement(key); }
  }

  async resetKey(key: string) {
    this.fallback.resetKey(key);
    if (!redisReady()) return;
    try { await getRedis().del(this.prefix + key); } catch { /* memory already reset */ }
  }
}
