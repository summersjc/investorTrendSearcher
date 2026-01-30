import { Injectable } from '@nestjs/common';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestTimestamp {
  timestamps: number[];
}

@Injectable()
export class RateLimiterService {
  private limits: Map<string, RequestTimestamp> = new Map();

  /**
   * Check if a request is allowed under the rate limit
   * @param key Unique identifier for the rate limit (e.g., 'sec-edgar', 'yahoo-finance')
   * @param config Rate limit configuration
   * @returns true if request is allowed, false otherwise
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create timestamp array for this key
    let record = this.limits.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.limits.set(key, record);
    }

    // Remove timestamps outside the window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    // Check if under limit
    if (record.timestamps.length >= config.maxRequests) {
      return false;
    }

    // Add current timestamp
    record.timestamps.push(now);
    return true;
  }

  /**
   * Wait until a request is allowed (with optional timeout)
   * @param key Unique identifier for the rate limit
   * @param config Rate limit configuration
   * @param maxWaitMs Maximum time to wait (default: 10000ms)
   */
  async waitForSlot(
    key: string,
    config: RateLimitConfig,
    maxWaitMs: number = 10000,
  ): Promise<void> {
    const startTime = Date.now();

    while (!(await this.checkLimit(key, config))) {
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error(`Rate limit timeout for ${key}`);
      }
      // Wait 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get time until next available slot
   * @param key Unique identifier for the rate limit
   * @param config Rate limit configuration
   */
  getTimeUntilReset(key: string, config: RateLimitConfig): number {
    const record = this.limits.get(key);
    if (!record || record.timestamps.length === 0) {
      return 0;
    }

    const oldestTimestamp = Math.min(...record.timestamps);
    const resetTime = oldestTimestamp + config.windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  /**
   * Clear all rate limit data for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  resetAll(): void {
    this.limits.clear();
  }
}
