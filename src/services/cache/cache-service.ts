// src/services/cache/CacheService.ts
import { INVENTORY_CONSTANTS } from '../../constants/inventory';
import { CacheEntry } from '../../types/enhanced';

export class CacheService<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly defaultTTL: number;

  constructor(
    maxEntries: number = INVENTORY_CONSTANTS.CACHE.MAX_ENTRIES,
    defaultTTL: number = INVENTORY_CONSTANTS.CACHE.TTL_MS
  ) {
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    const cacheKey = this.normalizeKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(cacheKey, entry);
  }

  get(key: string): T | null {
    const cacheKey = this.normalizeKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const cacheKey = this.normalizeKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const cacheKey = this.normalizeKey(key);
    return this.cache.delete(cacheKey);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    let totalAccesses = 0;
    let hits = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxEntries,
      hitRate: totalAccesses > 0 ? hits / totalAccesses : 0,
      expiredEntries: expiredCount,
    };
  }
}