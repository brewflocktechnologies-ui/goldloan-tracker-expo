import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = '@gl_cache:';

export const CacheTTL = {
  GOLD_RATES: 60 * 60 * 1000,    // 60 minutes
  DASHBOARD: 30 * 60 * 1000,     // 30 minutes
  LISTS: 30 * 60 * 1000,         // 30 minutes (users, ornaments, loans, payments)
  DETAILS: 30 * 60 * 1000,       // 30 minutes
  SHORT: 2 * 60 * 1000,          // 2 minutes
  SYNC_DATA: 30 * 60 * 1000,     // 30 minutes
};

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Store item in both in-memory Map and persistent AsyncStorage
   */
  async set<T>(key: string, data: T, ttlMs: number = CacheTTL.LISTS): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };

    // 1. Level 1: In-memory (instant)
    this.memoryCache.set(key, entry);

    // 2. Level 2: Persistent storage (disk)
    try {
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.warn(`[Cache] Failed to persist key "${key}":`, e);
    }
  }

  /**
   * Retrieve item from memory or disk cache
   * @param key cache key
   * @param allowStale if true, returns data even if expired (for offline / instant UI)
   */
  async get<T>(key: string, allowStale: boolean = false): Promise<{ data: T | null; isStale: boolean; timestamp: number | null }> {
    const now = Date.now();

    // Check Memory Cache first (0 ms)
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      const isStale = now > entry.expiresAt;
      if (!isStale || allowStale) {
        return { data: entry.data as T, isStale, timestamp: entry.timestamp };
      }
    }

    // Check Disk Cache (AsyncStorage)
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        // Hydrate memory cache
        this.memoryCache.set(key, entry);

        const isStale = now > entry.expiresAt;
        if (!isStale || allowStale) {
          return { data: entry.data, isStale, timestamp: entry.timestamp };
        }
      }
    } catch (e) {
      console.warn(`[Cache] Error reading key "${key}":`, e);
    }

    return { data: null, isStale: false, timestamp: null };
  }

  /**
   * Invalidate specific keys or keys matching a prefix
   */
  async invalidate(prefixOrKey: string): Promise<void> {
    // Invalidate in memory
    for (const key of this.memoryCache.keys()) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate in AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(k => 
        k === CACHE_PREFIX + prefixOrKey || k.startsWith(CACHE_PREFIX + prefixOrKey)
      );
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (e) {
      console.warn('[Cache] Error invalidating disk cache:', e);
    }
  }

  /**
   * Invalidate an entity and any dependent caches (sync data, dashboard)
   */
  async invalidateEntity(entity: string): Promise<void> {
    await this.invalidate(entity);
    await this.invalidate('initial_sync_data');
    await this.invalidate('dashboard');
  }

  /**
   * Clear entire app cache
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (e) {
      console.warn('[Cache] Error clearing all cache:', e);
    }
  }

  /**
   * Return number of cached items
   */
  async getCacheStats(): Promise<{ memoryCount: number; diskCount: number }> {
    let diskCount = 0;
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      diskCount = allKeys.filter(k => k.startsWith(CACHE_PREFIX)).length;
    } catch (e) {
      // ignore
    }
    return {
      memoryCount: this.memoryCache.size,
      diskCount,
    };
  }
}

export const cache = new CacheService();
