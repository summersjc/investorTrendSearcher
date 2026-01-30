import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { RateLimiterService } from '../base/rate-limiter.service';
import { BaseApiService } from '../base/base-api.service';
import {
  YahooQuote,
  YahooHistoricalData,
  YahooFinancials,
  YahooCompanyProfile,
} from './yahoo-finance.types';

@Injectable()
export class YahooFinanceService extends BaseApiService {
  constructor(
    cacheService: CacheService,
    rateLimiter: RateLimiterService,
    configService: ConfigService,
  ) {
    super(cacheService, rateLimiter, configService, 'YahooFinanceService', {
      baseURL: 'https://query2.finance.yahoo.com',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      rateLimitKey: 'yahoo-finance',
      rateLimitMax: 60, // Conservative limit
      rateLimitWindowMs: 60000, // 1 minute
      cacheTTL: 3600, // 1 hour for market data
    });
  }

  /**
   * Get real-time quote for a ticker symbol
   * @param symbol Stock ticker symbol (e.g., 'AAPL')
   */
  async getQuote(symbol: string): Promise<YahooQuote | null> {
    try {
      const cacheKey = this.generateCacheKey('yahoo:quote', { symbol });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: '/v7/finance/quote',
          params: {
            symbols: symbol.toUpperCase(),
          },
        },
        {
          cacheKey,
          cacheTTL: this.cacheService.getMarketDataTTL(),
        },
      );

      const result = response.quoteResponse?.result?.[0];
      if (!result) {
        this.logger.warn(`Quote not found for symbol: ${symbol}`);
        return null;
      }

      return this.mapQuoteResponse(result);
    } catch (error) {
      this.logger.error(`Error fetching quote for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get historical price data for a ticker
   * @param symbol Stock ticker symbol
   * @param period Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
   * @param interval Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
   */
  async getHistoricalData(
    symbol: string,
    period: string = '1y',
    interval: string = '1d',
  ): Promise<YahooHistoricalData[]> {
    try {
      const cacheKey = this.generateCacheKey('yahoo:historical', { symbol, period, interval });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: `/v8/finance/chart/${symbol.toUpperCase()}`,
          params: {
            range: period,
            interval: interval,
          },
        },
        {
          cacheKey,
          cacheTTL: interval === '1d' ? 3600 : 300, // Longer cache for daily data
        },
      );

      const result = response.chart?.result?.[0];
      if (!result) {
        this.logger.warn(`Historical data not found for symbol: ${symbol}`);
        return [];
      }

      return this.mapHistoricalData(result);
    } catch (error) {
      this.logger.error(`Error fetching historical data for ${symbol}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get company profile and business information
   * @param symbol Stock ticker symbol
   */
  async getCompanyProfile(symbol: string): Promise<YahooCompanyProfile | null> {
    try {
      const cacheKey = this.generateCacheKey('yahoo:profile', { symbol });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: `/v10/finance/quoteSummary/${symbol.toUpperCase()}`,
          params: {
            modules: 'assetProfile,summaryProfile',
          },
        },
        {
          cacheKey,
          cacheTTL: 604800, // 7 days
        },
      );

      const result = response.quoteSummary?.result?.[0];
      if (!result) {
        this.logger.warn(`Profile not found for symbol: ${symbol}`);
        return null;
      }

      return this.mapProfileResponse(symbol, result);
    } catch (error) {
      this.logger.error(`Error fetching profile for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get financial data for a company
   * @param symbol Stock ticker symbol
   */
  async getFinancials(symbol: string): Promise<YahooFinancials | null> {
    try {
      const cacheKey = this.generateCacheKey('yahoo:financials', { symbol });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: `/v10/finance/quoteSummary/${symbol.toUpperCase()}`,
          params: {
            modules: 'financialData,defaultKeyStatistics,incomeStatementHistory',
          },
        },
        {
          cacheKey,
          cacheTTL: 86400, // 24 hours
        },
      );

      const result = response.quoteSummary?.result?.[0];
      if (!result) {
        this.logger.warn(`Financials not found for symbol: ${symbol}`);
        return null;
      }

      return this.mapFinancialsResponse(symbol, result);
    } catch (error) {
      this.logger.error(`Error fetching financials for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Search for stocks by query
   * @param query Search term
   */
  async search(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    try {
      const cacheKey = this.generateCacheKey('yahoo:search', { query });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: '/v1/finance/search',
          params: {
            q: query,
            quotesCount: 10,
            newsCount: 0,
          },
        },
        {
          cacheKey,
          cacheTTL: 3600, // 1 hour
        },
      );

      const quotes = response.quotes || [];
      return quotes.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        type: quote.quoteType || 'EQUITY',
        exchange: quote.exchange,
      }));
    } catch (error) {
      this.logger.error(`Error searching: ${error.message}`);
      return [];
    }
  }

  private mapQuoteResponse(data: any): YahooQuote {
    return {
      symbol: data.symbol,
      shortName: data.shortName,
      longName: data.longName,
      regularMarketPrice: data.regularMarketPrice,
      regularMarketChange: data.regularMarketChange,
      regularMarketChangePercent: data.regularMarketChangePercent,
      regularMarketVolume: data.regularMarketVolume,
      regularMarketDayHigh: data.regularMarketDayHigh,
      regularMarketDayLow: data.regularMarketDayLow,
      regularMarketOpen: data.regularMarketOpen,
      regularMarketPreviousClose: data.regularMarketPreviousClose,
      marketCap: data.marketCap,
      fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: data.fiftyTwoWeekLow,
      averageDailyVolume10Day: data.averageDailyVolume10Day,
      averageDailyVolume3Month: data.averageDailyVolume3Month,
      trailingPE: data.trailingPE,
      forwardPE: data.forwardPE,
      dividendRate: data.dividendRate,
      dividendYield: data.dividendYield,
      beta: data.beta,
      currency: data.currency,
      exchange: data.exchange,
      quoteType: data.quoteType,
      marketState: data.marketState,
    };
  }

  private mapHistoricalData(data: any): YahooHistoricalData[] {
    const timestamps = data.timestamp || [];
    const quotes = data.indicators?.quote?.[0] || {};
    const adjClose = data.indicators?.adjclose?.[0]?.adjclose || [];

    return timestamps.map((timestamp: number, i: number) => ({
      date: new Date(timestamp * 1000),
      open: quotes.open?.[i] || 0,
      high: quotes.high?.[i] || 0,
      low: quotes.low?.[i] || 0,
      close: quotes.close?.[i] || 0,
      adjClose: adjClose[i] || quotes.close?.[i] || 0,
      volume: quotes.volume?.[i] || 0,
    }));
  }

  private mapProfileResponse(symbol: string, data: any): YahooCompanyProfile {
    const profile = data.assetProfile || data.summaryProfile || {};
    return {
      symbol,
      name: profile.longName || symbol,
      description: profile.longBusinessSummary,
      sector: profile.sector,
      industry: profile.industry,
      website: profile.website,
      employees: profile.fullTimeEmployees,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      phone: profile.phone,
    };
  }

  private mapFinancialsResponse(symbol: string, data: any): YahooFinancials {
    const financial = data.financialData || {};
    const keyStats = data.defaultKeyStatistics || {};

    return {
      symbol,
      revenue: financial.totalRevenue?.raw,
      revenueGrowth: financial.revenueGrowth?.raw,
      grossProfit: financial.grossProfits?.raw,
      ebitda: financial.ebitda?.raw,
      netIncome: keyStats.netIncomeToCommon?.raw,
      eps: keyStats.trailingEps?.raw,
      totalAssets: financial.totalAssets?.raw,
      totalLiabilities: financial.totalLiabilities?.raw,
      totalDebt: financial.totalDebt?.raw,
      cash: financial.totalCash?.raw,
      operatingCashFlow: financial.operatingCashflow?.raw,
      freeCashFlow: financial.freeCashflow?.raw,
    };
  }
}
