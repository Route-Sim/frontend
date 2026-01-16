import '@testing-library/jest-dom/vitest';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

function ensureStorage(name: 'localStorage' | 'sessionStorage'): void {
  const current = (globalThis as Record<string, unknown>)[name];
  if (!current || typeof (current as Storage).clear !== 'function') {
    const storage = new MemoryStorage();
    Object.defineProperty(globalThis, name, {
      value: storage,
      writable: false,
      configurable: true,
    });
  }
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');
