// @ts-nocheck
import axios from 'axios';

// Read-first integration framework for external registries (scheme directory, institutions, guidelines).
//  - Only GET requests go through here. Anything that changes data on a registry stays an explicit, separate call.
//  - A fresh cached answer is used before the registry is contacted at all.
//  - Each registry has its own rate limit (token bucket), timeout and circuit breaker.
//  - If the registry is slow, failing, over its limit or switched off, the last good answer is served and marked stale.

export type IntegrationConfig = {
  name: string;
  baseUrl: string;
  apiKey?: string;
  ratePerMinute?: number; // upstream calls allowed per minute
  timeoutMs?: number;
  ttlMs?: number; // how long a cached answer counts as fresh
  failureThreshold?: number; // consecutive failures before the breaker opens
  cooldownMs?: number; // how long the breaker stays open
};

export type CacheStore = {
  get(key: string): Promise<{ value: any; fetchedAt: number } | null>;
  set(key: string, integration: string, value: any, fetchedAt: number): Promise<void>;
};

export type ReadResult<T> = {
  data: T;
  source: 'live' | 'cache' | 'fallback';
  stale: boolean;
  fetchedAt: number | null;
  reason?: string;
};

type State = {
  config: Required<Omit<IntegrationConfig, 'apiKey'>> & { apiKey: string };
  tokens: number;
  refilledAt: number;
  failures: number;
  openUntil: number;
  lastSuccessAt: number | null;
  lastError: string | null;
  calls: { live: number; cache: number; fallback: number; limited: number };
};

const registry = new Map<string, State>();
const memory = new Map<string, { value: any; fetchedAt: number }>();

const mongoStore: CacheStore = {
  async get(key) {
    const { IntegrationCache } = await import('../../models/IntegrationCache.model');
    const doc: any = await IntegrationCache.findOne({ key }).lean();
    return doc ? { value: doc.value, fetchedAt: new Date(doc.fetchedAt).getTime() } : null;
  },
  async set(key, integration, value, fetchedAt) {
    const { IntegrationCache } = await import('../../models/IntegrationCache.model');
    await IntegrationCache.updateOne({ key }, { $set: { integration, value, fetchedAt: new Date(fetchedAt) } }, { upsert: true });
  },
};
let store: CacheStore = mongoStore;
export function setCacheStore(next: CacheStore | null) {
  store = next || mongoStore;
  memory.clear();
}

export function registerIntegration(config: IntegrationConfig) {
  const full = {
    ratePerMinute: 30,
    timeoutMs: 8000,
    ttlMs: 6 * 60 * 60 * 1000,
    failureThreshold: 3,
    cooldownMs: 60_000,
    apiKey: '',
    ...config,
  };
  registry.set(config.name, {
    config: full,
    tokens: full.ratePerMinute,
    refilledAt: Date.now(),
    failures: 0,
    openUntil: 0,
    lastSuccessAt: null,
    lastError: null,
    calls: { live: 0, cache: 0, fallback: 0, limited: 0 },
  });
}

function takeToken(state: State, now: number): boolean {
  const { ratePerMinute } = state.config;
  state.tokens = Math.min(ratePerMinute, state.tokens + (Math.max(0, now - state.refilledAt) / 60_000) * ratePerMinute);
  state.refilledAt = now;
  if (state.tokens < 1) return false;
  state.tokens -= 1;
  return true;
}

async function cached(key: string) {
  const hit = memory.get(key);
  if (hit) return hit;
  try {
    const stored = await store.get(key);
    if (stored) memory.set(key, stored);
    return stored;
  } catch {
    return null; // a cache problem must never break a request
  }
}

export async function readThrough<T>(
  name: string,
  path: string,
  options: { pick?: (body: any) => T; fallback?: () => T; now?: () => number } = {}
): Promise<ReadResult<T>> {
  const state = registry.get(name);
  if (!state) throw new Error(`Integration "${name}" is not registered`);
  const now = (options.now || Date.now)();
  const key = `${name}:${path}`;
  const hit = await cached(key);

  const serveCache = (reason: string): ReadResult<T> | null => {
    if (hit) {
      state.calls.cache += 1;
      return { data: hit.value, source: 'cache', stale: now - hit.fetchedAt > state.config.ttlMs, fetchedAt: hit.fetchedAt, reason };
    }
    return null;
  };

  // 1. Read-first: a fresh cached answer needs no upstream call.
  if (hit && now - hit.fetchedAt <= state.config.ttlMs) {
    state.calls.cache += 1;
    return { data: hit.value, source: 'cache', stale: false, fetchedAt: hit.fetchedAt };
  }

  const degrade = (reason: string): ReadResult<T> => {
    const fromCache = serveCache(reason);
    if (fromCache) return fromCache;
    if (options.fallback) {
      state.calls.fallback += 1;
      return { data: options.fallback(), source: 'fallback', stale: true, fetchedAt: null, reason };
    }
    const err: any = new Error(`${name} is unavailable (${reason}) and nothing is cached yet`);
    err.code = 'INTEGRATION_UNAVAILABLE';
    throw err;
  };

  // 2. Breaker and rate limit.
  if (now < state.openUntil) return degrade('registry unavailable, retrying shortly');
  if (!state.config.baseUrl) return degrade('registry not configured');
  if (!takeToken(state, now)) {
    state.calls.limited += 1;
    return degrade('rate limit reached');
  }

  // 3. Upstream call.
  try {
    const response = await axios.get(`${state.config.baseUrl.replace(/\/+$/, '')}${path}`, {
      timeout: state.config.timeoutMs,
      maxRedirects: 0,
      headers: {
        Accept: 'application/json',
        ...(state.config.apiKey ? { Authorization: `Bearer ${state.config.apiKey}` } : {}),
      },
    });
    const data = options.pick ? options.pick(response.data) : response.data;
    if (data === undefined || data === null) throw new Error('empty answer');
    state.failures = 0;
    state.lastSuccessAt = now;
    state.lastError = null;
    state.calls.live += 1;
    memory.set(key, { value: data, fetchedAt: now });
    store.set(key, name, data, now).catch(() => undefined);
    return { data, source: 'live', stale: false, fetchedAt: now };
  } catch (error: any) {
    state.failures += 1;
    state.lastError = String(error?.code || error?.response?.status || error?.message || 'error').slice(0, 80);
    if (state.failures >= state.config.failureThreshold) state.openUntil = now + state.config.cooldownMs;
    return degrade(`registry error: ${state.lastError}`);
  }
}

export function integrationStatus() {
  const now = Date.now();
  return [...registry.values()].map((s) => ({
    name: s.config.name,
    configured: !!s.config.baseUrl,
    ratePerMinute: s.config.ratePerMinute,
    ttlMinutes: Math.round(s.config.ttlMs / 60_000),
    breaker: now < s.openUntil ? 'open' : 'closed',
    consecutiveFailures: s.failures,
    lastSuccessAt: s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString() : null,
    lastError: s.lastError,
    calls: { ...s.calls },
  }));
}

export function resetIntegrationsForTests() {
  registry.clear();
  memory.clear();
}
