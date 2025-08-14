import { createMemo, createSignal, Accessor } from 'solid-js';

/**
 * Performance utilities for optimizing expensive computations and operations
 */

/**
 * Creates a memoized computation that only recalculates when dependencies change
 */
export function createMemoizedComputation<T>(
  computation: () => T,
  deps: Accessor<any>[]
): Accessor<T> {
  return createMemo(() => {
    // Access all dependencies to track them
    deps.forEach(dep => dep());
    return computation();
  });
}

/**
 * Creates a debounced signal that delays updates until after a specified delay
 */
export function createDebouncedSignal<T>(
  initialValue: T,
  delay: number = 300
): [Accessor<T>, (value: T) => void] {
  const [signal, setSignal] = createSignal<T>(initialValue);
  const [debouncedSignal, setDebouncedSignal] = createSignal<T>(initialValue);
  
  let timeoutId: number | undefined;
  
  const debouncedSetter = (value: T) => {
    setSignal(value);
    
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      setDebouncedSignal(value);
      timeoutId = undefined;
    }, delay);
  };
  
  return [debouncedSignal, debouncedSetter];
}

/**
 * Creates a throttled function that limits how often it can be called
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 100
): T {
  let lastCall = 0;
  let timeoutId: number | undefined;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    } else {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = undefined;
      }, delay - (now - lastCall));
    }
  }) as T;
}

/**
 * LRU Cache implementation for memoizing expensive computations
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

/**
 * Creates a memoized function with LRU cache
 */
export function createMemoizedFunction<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  keyGenerator?: (...args: Args) => string,
  maxCacheSize: number = 100
): (...args: Args) => Return {
  const cache = new LRUCache<string, Return>(maxCacheSize);
  
  const defaultKeyGenerator = (...args: Args): string => {
    return JSON.stringify(args);
  };
  
  const generateKey = keyGenerator || defaultKeyGenerator;
  
  return (...args: Args): Return => {
    const key = generateKey(...args);
    const cached = cache.get(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Lazy loading utility for virtual directories
 */
export class LazyLoader<T> {
  private loadingPromises = new Map<string, Promise<T>>();
  private cache = new LRUCache<string, T>(50);
  private loadingStates = new Map<string, boolean>();
  
  async load(
    key: string,
    loader: () => Promise<T>,
    options: {
      forceReload?: boolean;
      timeout?: number;
    } = {}
  ): Promise<{ data: T | null; isLoading: boolean; error: Error | null }> {
    const { forceReload = false, timeout = 10000 } = options;
    
    // Check cache first
    if (!forceReload) {
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        return { data: cached, isLoading: false, error: null };
      }
    }
    
    // Check if already loading
    const existingPromise = this.loadingPromises.get(key);
    if (existingPromise && !forceReload) {
      try {
        const data = await existingPromise;
        return { data, isLoading: false, error: null };
      } catch (error) {
        return { data: null, isLoading: false, error: error as Error };
      }
    }
    
    // Start loading
    this.loadingStates.set(key, true);
    
    const loadPromise = Promise.race([
      loader(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    
    this.loadingPromises.set(key, loadPromise);
    
    try {
      const data = await loadPromise;
      this.cache.set(key, data);
      this.loadingStates.set(key, false);
      this.loadingPromises.delete(key);
      return { data, isLoading: false, error: null };
    } catch (error) {
      this.loadingStates.set(key, false);
      this.loadingPromises.delete(key);
      return { data: null, isLoading: false, error: error as Error };
    }
  }
  
  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }
  
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    this.loadingStates.clear();
  }
  
  getCacheSize(): number {
    return this.cache.size();
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number[]>();
  
  start(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      
      const measurements = this.measurements.get(label)!;
      measurements.push(duration);
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }
      
      // Log slow operations in development
      if (import.meta.env.DEV && duration > 100) {
        console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  getStats(label: string): { avg: number; min: number; max: number; count: number } | null {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    const avg = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { avg, min, max, count: measurements.length };
  }
  
  clear(): void {
    this.measurements.clear();
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();