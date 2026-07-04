const MAX_SIZE = 500;
const DEFAULT_TTL_MS = 60_000;

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(
  key: string,
  value: unknown,
  options?: { ttl?: number }
): void {
  if (store.size >= MAX_SIZE && !store.has(key)) {
    // Evict the oldest entry (first key in insertion order)
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  const ttl = options?.ttl ?? DEFAULT_TTL_MS;
  store.set(key, { value, expiresAt: Date.now() + ttl });
}

export function cacheStats() {
  return { size: store.size };
}
