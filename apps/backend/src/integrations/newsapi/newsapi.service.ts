import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { RateLimiterService } from '../base/rate-limiter.service';
import { BaseApiService } from '../base/base-api.service';

export interface NewsArticle {
  source: {
    id?: string;
    name: string;
  };
  author?: string;
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  content?: string;
}

@Injectable()
export class NewsApiService extends BaseApiService {
  private readonly apiKey: string;

  constructor(
    cacheService: CacheService,
    rateLimiter: RateLimiterService,
    configService: ConfigService,
  ) {
    const apiKey = configService.get<string>('NEWS_API_KEY');

    super(cacheService, rateLimiter, configService, 'NewsApiService', {
      baseURL: 'https://newsapi.org/v2',
      rateLimitKey: 'newsapi',
      rateLimitMax: 100, // Free tier: 100 requests per day
      rateLimitWindowMs: 86400000, // 24 hours
      cacheTTL: 86400, // 24 hours
    });

    this.apiKey = apiKey || '';

    if (!apiKey) {
      this.logger.warn('NEWS_API_KEY not configured - NewsAPI features will be limited');
    }
  }

  /**
   * Search for news articles
   * @param query Search query (company name, keyword, etc.)
   * @param options Additional search options
   */
  async searchNews(
    query: string,
    options: {
      from?: Date;
      to?: Date;
      language?: string;
      sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
      pageSize?: number;
    } = {},
  ): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      this.logger.warn('NEWS_API_KEY not configured');
      return [];
    }

    try {
      const cacheKey = this.generateCacheKey('news:search', { query, ...options });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: '/everything',
          params: {
            q: query,
            apiKey: this.apiKey,
            from: options.from?.toISOString().split('T')[0],
            to: options.to?.toISOString().split('T')[0],
            language: options.language || 'en',
            sortBy: options.sortBy || 'publishedAt',
            pageSize: options.pageSize || 20,
          },
        },
        {
          cacheKey,
          cacheTTL: this.cacheService.getNewsTTL(),
        },
      );

      return response.articles || [];
    } catch (error) {
      this.logger.error(`Error searching news: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recent news for a company
   * @param companyName Company name
   * @param daysBack Number of days to look back (default: 30)
   */
  async getCompanyNews(companyName: string, daysBack: number = 30): Promise<NewsArticle[]> {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - daysBack);

    return this.searchNews(companyName, {
      from,
      to,
      sortBy: 'publishedAt',
      pageSize: 10,
    });
  }

  /**
   * Get funding announcements (searches for funding-related keywords)
   * @param companyName Company name
   */
  async getFundingNews(companyName: string): Promise<NewsArticle[]> {
    const query = `"${companyName}" AND (funding OR "raised" OR "investment" OR "series" OR "round")`;

    return this.searchNews(query, {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      sortBy: 'relevancy',
      pageSize: 10,
    });
  }

  /**
   * Get top headlines by category
   * @param category Category (business, technology, etc.)
   * @param country Country code (us, gb, etc.)
   */
  async getTopHeadlines(
    category: string = 'business',
    country: string = 'us',
  ): Promise<NewsArticle[]> {
    if (!this.apiKey) {
      this.logger.warn('NEWS_API_KEY not configured');
      return [];
    }

    try {
      const cacheKey = this.generateCacheKey('news:headlines', { category, country });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: '/top-headlines',
          params: {
            apiKey: this.apiKey,
            category,
            country,
            pageSize: 20,
          },
        },
        {
          cacheKey,
          cacheTTL: 3600, // 1 hour for headlines
        },
      );

      return response.articles || [];
    } catch (error) {
      this.logger.error(`Error fetching headlines: ${error.message}`);
      return [];
    }
  }
}
