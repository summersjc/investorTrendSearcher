import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CacheService } from '../../cache/cache.service';
import { RateLimiterService } from './rate-limiter.service';

export interface ApiConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  rateLimitKey?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  cacheTTL?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

@Injectable()
export class BaseApiService {
  protected readonly logger: Logger;
  protected client: AxiosInstance;
  protected config: ApiConfig;

  constructor(
    protected readonly cacheService: CacheService,
    protected readonly rateLimiter: RateLimiterService,
    protected readonly configService: ConfigService,
    serviceName: string,
    config: ApiConfig,
  ) {
    this.logger = new Logger(serviceName);
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      },
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        );
        return response;
      },
      (error) => {
        this.logger.error(
          `Response error: ${error.response?.status || 'N/A'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        );
        return Promise.reject(error);
      },
    );
  }

  /**
   * Make an API request with rate limiting, caching, and retry logic
   */
  protected async request<T>(
    config: AxiosRequestConfig,
    options: {
      cacheKey?: string;
      cacheTTL?: number;
      skipCache?: boolean;
      skipRateLimit?: boolean;
    } = {},
  ): Promise<T> {
    const { cacheKey, cacheTTL, skipCache = false, skipRateLimit = false } = options;

    // Check cache first
    if (cacheKey && !skipCache) {
      const cached = await this.cacheService.get<T>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    // Apply rate limiting
    if (this.config.rateLimitKey && !skipRateLimit) {
      await this.rateLimiter.waitForSlot(this.config.rateLimitKey, {
        maxRequests: this.config.rateLimitMax || 10,
        windowMs: this.config.rateLimitWindowMs || 60000,
      });
    }

    // Make request with retry logic
    const data = await this.requestWithRetry<T>(config);

    // Cache the response
    if (cacheKey && !skipCache) {
      const ttl = cacheTTL || this.config.cacheTTL || this.cacheService.getDefaultTTL();
      await this.cacheService.set(cacheKey, data, ttl);
      this.logger.debug(`Cached: ${cacheKey} (TTL: ${ttl}s)`);
    }

    return data;
  }

  /**
   * Make request with retry logic
   */
  private async requestWithRetry<T>(
    config: AxiosRequestConfig,
    attempt: number = 1,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error) {
      const maxAttempts = this.config.retryAttempts || 3;

      if (attempt < maxAttempts && this.isRetryableError(error)) {
        const delay = this.config.retryDelay || 1000;
        this.logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);

        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        return this.requestWithRetry<T>(config, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network error, timeout, etc.
      return true;
    }

    const status = error.response.status;
    // Retry on 429 (rate limit), 500, 502, 503, 504
    return status === 429 || status >= 500;
  }

  /**
   * Generate a cache key from request config
   */
  protected generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }
}
