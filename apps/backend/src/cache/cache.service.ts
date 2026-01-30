import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis error:', error);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('👋 Redis disconnected');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async flushAll(): Promise<void> {
    await this.client.flushall();
  }

  getDefaultTTL(): number {
    return this.configService.get<number>('DEFAULT_CACHE_TTL_SECONDS', 604800); // 7 days
  }

  getMarketDataTTL(): number {
    return this.configService.get<number>('MARKET_DATA_TTL_SECONDS', 3600); // 1 hour
  }

  getNewsTTL(): number {
    return this.configService.get<number>('NEWS_TTL_SECONDS', 86400); // 24 hours
  }
}
