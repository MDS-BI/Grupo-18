import { beforeEach } from 'vitest';
import { setActiveConfig } from '../../src/module-config.js';

globalThis.__ERP_BASE_SEED_DISABLED__ = true;

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    }
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = createMemoryStorage();
}

beforeEach(() => {
  setActiveConfig(null);
});
