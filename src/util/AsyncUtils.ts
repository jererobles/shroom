/**
 * Utility functions for async operations
 */

import { LoadProgress } from "../interfaces/IAsyncInitializable";

/**
 * Convert a callback-based function to a promise
 */
export function promisify<T>(
  fn: (callback: (error: Error | null, result?: T) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result as T);
      }
    });
  });
}

/**
 * Create a progress tracker for batch operations
 */
export class ProgressTracker {
  private _loaded = 0;
  private _total: number;
  private _onProgress?: (progress: LoadProgress) => void;
  private _currentItem?: string;

  constructor(total: number, onProgress?: (progress: LoadProgress) => void) {
    this._total = total;
    this._onProgress = onProgress;
    this._reportProgress();
  }

  increment(itemName?: string) {
    this._loaded++;
    this._currentItem = itemName;
    this._reportProgress();
  }

  setCurrentItem(itemName: string) {
    this._currentItem = itemName;
    this._reportProgress();
  }

  private _reportProgress() {
    if (this._onProgress) {
      this._onProgress({
        loaded: this._loaded,
        total: this._total,
        currentItem: this._currentItem,
        percentage: Math.round((this._loaded / this._total) * 100),
      });
    }
  }
}

/**
 * Batch load items with concurrency control
 */
export async function batchLoad<T, R>(
  items: T[],
  loader: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    onProgress?: (progress: LoadProgress) => void;
    onItemComplete?: (item: T, result: R) => void;
    onItemError?: (item: T, error: Error) => void;
  } = {}
): Promise<{ loaded: R[]; failed: Array<{ item: T; error: Error }> }> {
  const { concurrency = 5, onProgress, onItemComplete, onItemError } = options;
  const tracker = new ProgressTracker(items.length, onProgress);
  const loaded: R[] = [];
  const failed: Array<{ item: T; error: Error }> = [];

  // Create chunks based on concurrency
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }

  // Process chunks sequentially, items within chunks in parallel
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          const result = await loader(item);
          loaded.push(result);
          onItemComplete?.(item, result);
          tracker.increment(String(item));
          return result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          failed.push({ item, error: err });
          onItemError?.(item, err);
          tracker.increment(String(item));
          throw error;
        }
      })
    );
  }

  return { loaded, failed };
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * Create a timeout wrapper for async operations
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError = new Error(`Operation timed out after ${timeoutMs}ms`)
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(timeoutError), timeoutMs)
    ),
  ]);
}

/**
 * Cache async results with optional TTL
 */
export class AsyncCache<K, V> {
  private _cache = new Map<K, { value: Promise<V>; timestamp: number }>();
  private _ttl?: number;

  constructor(ttlMs?: number) {
    this._ttl = ttlMs;
  }

  async get(
    key: K,
    factory: () => Promise<V>,
    forceFresh = false
  ): Promise<V> {
    const now = Date.now();
    const cached = this._cache.get(key);

    if (!forceFresh && cached) {
      if (!this._ttl || now - cached.timestamp < this._ttl) {
        return cached.value;
      }
    }

    const value = factory();
    this._cache.set(key, { value, timestamp: now });
    return value;
  }

  clear() {
    this._cache.clear();
  }

  delete(key: K) {
    this._cache.delete(key);
  }
}
