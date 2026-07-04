// Simple response cache keyed by request signature. Speeds up repeated
// identical lookups (e.g. the same search expression hit repeatedly).
const store = new Map<string, unknown>();

export function cacheGet<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function cacheSet(key: string, value: unknown): void {
  store.set(key, value);
}

export function cacheStats() {
  return { size: store.size };
}
