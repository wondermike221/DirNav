import { DirTree } from '../types';
import { LazyLoader, performanceMonitor } from './performance';

export interface VirtualDirectoryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  fallbackContent?: DirTree;
}

export interface VirtualDirectoryResult {
  success: boolean;
  data?: DirTree;
  error?: Error;
  retryCount: number;
  fromCache?: boolean;
}

/**
 * Enhanced virtual directory handler with retry logic, timeout, lazy loading, and fallback support
 */
export class VirtualDirectoryHandler {
  private defaultOptions: Required<VirtualDirectoryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    fallbackContent: {}
  };
  
  private lazyLoader = new LazyLoader<DirTree>();
  private loadingKeys = new Set<string>();

  constructor(private options: VirtualDirectoryOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Load virtual directory with retry logic, timeout, and lazy loading
   */
  async loadVirtualDirectory(
    loader: () => Promise<DirTree>,
    options?: Partial<VirtualDirectoryOptions> & { key?: string; forceReload?: boolean }
  ): Promise<VirtualDirectoryResult> {
    const config = { ...this.options, ...options };
    const loadKey = options?.key || `virtual_${Date.now()}_${Math.random()}`;
    
    // Prevent duplicate loading of the same virtual directory
    if (this.loadingKeys.has(loadKey) && !options?.forceReload) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.loadVirtualDirectory(loader, { ...options, key: loadKey });
    }

    this.loadingKeys.add(loadKey);
    const endMeasurement = performanceMonitor.start('virtual-directory-load');
    
    try {
      const result = await this.lazyLoader.load(loadKey, async () => {
        let lastError: Error | undefined;
        
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
          try {
            const data = await this.executeWithTimeout(loader, config.timeout);
            
            // Validate the loaded data
            if (!this.validateResult(data)) {
              throw new Error('Invalid virtual directory data structure');
            }
            
            return data;
          } catch (error) {
            lastError = error as Error;
            console.warn(`Virtual directory load attempt ${attempt + 1} failed:`, error);
            
            // If this isn't the last attempt, wait before retrying
            if (attempt < config.maxRetries) {
              await this.delay(config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
            }
          }
        }

        // All attempts failed
        throw lastError || new Error('Virtual directory loading failed');
      }, {
        forceReload: options?.forceReload,
        timeout: config.timeout + 5000 // Add buffer to lazy loader timeout
      });

      if (result.data) {
        return {
          success: true,
          data: result.data,
          retryCount: 0, // LazyLoader handles retries internally
          fromCache: false // LazyLoader manages cache internally
        };
      } else {
        return {
          success: false,
          error: result.error || new Error('Unknown error loading virtual directory'),
          retryCount: config.maxRetries
        };
      }
    } finally {
      this.loadingKeys.delete(loadKey);
      endMeasurement();
    }
  }

  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Virtual directory loading timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get fallback content when virtual directory fails
   */
  getFallbackContent(): DirTree {
    return this.options.fallbackContent || {
      'error_fallback': {
        name: 'Error Fallback',
        type: 'action',
        action: () => alert('Virtual directory failed to load. This is fallback content.')
      },
      'cache_info': {
        name: 'Cache Info',
        type: 'action',
        action: () => {
          const stats = this.getCacheStats();
          console.log(`Virtual directory cache: ${stats.size} items`);
        }
      }
    };
  }

  /**
   * Clear the virtual directory cache
   */
  clearCache(): void {
    this.lazyLoader.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return {
      size: this.lazyLoader.getCacheSize()
    };
  }

  /**
   * Check if a virtual directory is currently loading
   */
  isLoading(key: string): boolean {
    return this.lazyLoader.isLoading(key) || this.loadingKeys.has(key);
  }

  /**
   * Create a loading state indicator
   */
  createLoadingState(message: string = 'Loading...'): DirTree {
    return {
      'loading': {
        name: message,
        type: 'action',
        action: () => {} // No-op action
      }
    };
  }

  /**
   * Validate virtual directory result
   */
  validateResult(data: any): data is DirTree {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if it's a valid directory tree structure
    for (const key in data) {
      const node = data[key];
      if (!node || typeof node !== 'object' || !node.type) {
        return false;
      }
      
      const validTypes = ['directory', 'action', 'input', 'virtual-directory'];
      if (!validTypes.includes(node.type)) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Default virtual directory handler instance
 */
export const defaultVirtualDirectoryHandler = new VirtualDirectoryHandler({
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 8000,
  fallbackContent: {
    'connection_error': {
      name: 'Connection Error',
      type: 'action',
      action: () => alert('Failed to load virtual directory. Please check your connection and try again.')
    },
    'retry_action': {
      name: 'Retry Loading',
      type: 'action',
      action: () => window.location.reload()
    }
  }
});

/**
 * Create a virtual directory loader with enhanced error handling
 */
export function createVirtualDirectoryLoader(
  originalLoader: () => Promise<DirTree>,
  options?: VirtualDirectoryOptions
) {
  const handler = new VirtualDirectoryHandler(options);
  
  return async (): Promise<DirTree> => {
    const result = await handler.loadVirtualDirectory(originalLoader, options);
    
    if (result.success && result.data) {
      if (!handler.validateResult(result.data)) {
        throw new Error('Virtual directory returned invalid data structure');
      }
      return result.data;
    } else {
      // Return fallback content instead of throwing
      console.warn('Using fallback content for virtual directory');
      return handler.getFallbackContent();
    }
  };
}

/**
 * Utility function to wrap existing virtual directory functions
 */
export function enhanceVirtualDirectory(
  node: any,
  options?: VirtualDirectoryOptions
): any {
  if (node.type === 'virtual-directory' && node.onSelect) {
    const originalOnSelect = node.onSelect;
    node.onSelect = createVirtualDirectoryLoader(originalOnSelect, options);
  }
  return node;
}