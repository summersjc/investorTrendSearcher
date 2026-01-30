import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { RateLimiterService } from '../base/rate-limiter.service';
import { BaseApiService } from '../base/base-api.service';
import { EdgarCompanyInfo, EdgarFiling } from './edgar.types';

@Injectable()
export class EdgarService extends BaseApiService {
  constructor(
    cacheService: CacheService,
    rateLimiter: RateLimiterService,
    configService: ConfigService,
  ) {
    super(cacheService, rateLimiter, configService, 'EdgarService', {
      baseURL: 'https://data.sec.gov',
      headers: {
        'User-Agent': configService.get<string>(
          'SEC_EDGAR_USER_AGENT',
          'InvestorResearch contact@example.com',
        ),
        Accept: 'application/json',
      },
      rateLimitKey: 'sec-edgar',
      rateLimitMax: 10, // 10 requests per second
      rateLimitWindowMs: 1000,
      cacheTTL: 604800, // 7 days
    });
  }

  /**
   * Get company information by CIK (Central Index Key)
   * @param cik Company CIK (can be ticker symbol, will be converted)
   */
  async getCompanyByCIK(cik: string): Promise<EdgarCompanyInfo | null> {
    try {
      // Remove leading zeros and pad to 10 digits
      const paddedCIK = cik.replace(/^0+/, '').padStart(10, '0');
      const cacheKey = this.generateCacheKey('edgar:company', { cik: paddedCIK });

      const data = await this.request<EdgarCompanyInfo>(
        {
          method: 'GET',
          url: `/submissions/CIK${paddedCIK}.json`,
        },
        { cacheKey },
      );

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(`Company not found: ${cik}`);
        return null;
      }
      this.logger.error(`Error fetching company ${cik}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for a company by ticker symbol
   * @param ticker Stock ticker symbol (e.g., 'AAPL')
   */
  async getCompanyByTicker(ticker: string): Promise<EdgarCompanyInfo | null> {
    try {
      const cacheKey = this.generateCacheKey('edgar:ticker', { ticker });

      // First, get the ticker-to-CIK mapping
      const tickers = await this.request<Record<string, number>>(
        {
          method: 'GET',
          url: '/files/company_tickers.json',
        },
        {
          cacheKey: 'edgar:company-tickers',
          cacheTTL: 86400, // 24 hours
        },
      );

      // Find the CIK for the ticker
      const tickerUpper = ticker.toUpperCase();
      const entry = Object.values(tickers).find(
        (item: any) => item.ticker?.toUpperCase() === tickerUpper,
      ) as any;

      if (!entry) {
        this.logger.warn(`Ticker not found: ${ticker}`);
        return null;
      }

      // Get full company info
      return this.getCompanyByCIK(entry.cik_str.toString());
    } catch (error) {
      this.logger.error(`Error fetching ticker ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recent filings for a company
   * @param cik Company CIK
   * @param formType Optional filter by form type (e.g., '10-K', '10-Q')
   * @param limit Number of filings to return
   */
  async getRecentFilings(
    cik: string,
    formType?: string,
    limit: number = 10,
  ): Promise<EdgarFiling[]> {
    const company = await this.getCompanyByCIK(cik);
    if (!company || !company.filings?.recent) {
      return [];
    }

    const recent = company.filings.recent;
    const filings: EdgarFiling[] = [];

    for (let i = 0; i < recent.accessionNumber.length && filings.length < limit; i++) {
      const form = recent.form[i];

      // Filter by form type if specified
      if (formType && form !== formType) {
        continue;
      }

      const accessionNumber = recent.accessionNumber[i].replace(/-/g, '');
      const primaryDoc = recent.primaryDocument[i];

      filings.push({
        accessionNumber: recent.accessionNumber[i],
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate[i],
        form: form,
        fileNumber: recent.fileNumber[i],
        filmNumber: recent.filmNumber[i],
        items: recent.items[i],
        size: recent.size[i],
        isXBRL: recent.isXBRL[i] === 1,
        isInlineXBRL: recent.isInlineXBRL[i] === 1,
        primaryDocument: primaryDoc,
        primaryDocDescription: recent.primaryDocDescription[i],
        documentUrl: `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, '')}/${accessionNumber}/${primaryDoc}`,
      });
    }

    return filings;
  }

  /**
   * Get all 10-K annual reports for a company
   * @param cik Company CIK
   * @param limit Number of reports to return
   */
  async getAnnualReports(cik: string, limit: number = 5): Promise<EdgarFiling[]> {
    return this.getRecentFilings(cik, '10-K', limit);
  }

  /**
   * Get all 10-Q quarterly reports for a company
   * @param cik Company CIK
   * @param limit Number of reports to return
   */
  async getQuarterlyReports(cik: string, limit: number = 8): Promise<EdgarFiling[]> {
    return this.getRecentFilings(cik, '10-Q', limit);
  }

  /**
   * Get insider trading forms (Form 4) for a company
   * @param cik Company CIK
   * @param limit Number of forms to return
   */
  async getInsiderTrading(cik: string, limit: number = 20): Promise<EdgarFiling[]> {
    return this.getRecentFilings(cik, '4', limit);
  }

  /**
   * Search for companies by name
   * @param query Company name to search
   */
  async searchCompanies(query: string): Promise<Array<{ cik: string; title: string }>> {
    try {
      const cacheKey = this.generateCacheKey('edgar:search', { query });

      // Get company tickers JSON
      const tickers = await this.request<Record<string, any>>(
        {
          method: 'GET',
          url: '/files/company_tickers.json',
        },
        {
          cacheKey: 'edgar:company-tickers',
          cacheTTL: 86400, // 24 hours
        },
      );

      // Filter by query
      const results = Object.values(tickers)
        .filter((item: any) => item.title?.toLowerCase().includes(query.toLowerCase()))
        .map((item: any) => ({
          cik: item.cik_str.toString().padStart(10, '0'),
          title: item.title,
          ticker: item.ticker,
        }))
        .slice(0, 10);

      return results;
    } catch (error) {
      this.logger.error(`Error searching companies: ${error.message}`);
      return [];
    }
  }
}
