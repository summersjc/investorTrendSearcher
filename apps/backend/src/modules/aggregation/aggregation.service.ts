import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EdgarService } from '../../integrations/sec-edgar/edgar.service';
import { YahooFinanceService } from '../../integrations/yahoo-finance/yahoo-finance.service';
import { OpenCorporatesService } from '../../integrations/opencorporates/opencorporates.service';
import { WikidataService } from '../../integrations/wikidata/wikidata.service';
import { NewsApiService } from '../../integrations/newsapi/newsapi.service';

export interface EnrichedCompanyData {
  basic: {
    name: string;
    description?: string;
    website?: string;
    industry?: string;
    sector?: string;
    headquarters?: string;
    foundedYear?: number;
  };
  financial?: {
    ticker?: string;
    exchange?: string;
    marketCap?: number;
    revenue?: number;
    price?: number;
    priceChange?: number;
  };
  legal?: {
    jurisdiction?: string;
    companyNumber?: string;
    registeredAddress?: string;
    officers?: Array<{ name: string; position: string }>;
  };
  news?: Array<{
    title: string;
    source: string;
    publishedAt: string;
    url: string;
  }>;
  rawData: {
    secEdgar?: any;
    yahooFinance?: any;
    openCorporates?: any;
    wikidata?: any;
    news?: any;
  };
  sources: string[];
  lastUpdated: Date;
}

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly edgarService: EdgarService,
    private readonly yahooService: YahooFinanceService,
    private readonly openCorporatesService: OpenCorporatesService,
    private readonly wikidataService: WikidataService,
    private readonly newsApiService: NewsApiService,
  ) {}

  /**
   * Enrich a company with data from all available sources
   * @param companyId Company database ID
   * @param ticker Optional ticker symbol for faster lookup
   */
  async enrichCompany(companyId: string, ticker?: string): Promise<EnrichedCompanyData> {
    this.logger.log(`Enriching company: ${companyId}`);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    const enrichedData: EnrichedCompanyData = {
      basic: {
        name: company.name,
        description: company.description || undefined,
        website: company.website || undefined,
        industry: company.industry || undefined,
        sector: company.sector || undefined,
        headquarters: company.headquarters || undefined,
        foundedYear: company.foundedYear || undefined,
      },
      rawData: {},
      sources: ['database'],
      lastUpdated: new Date(),
    };

    const tickerSymbol = ticker || company.ticker;

    // Fetch data from all sources in parallel
    const [edgarData, yahooQuote, yahooProfile, yahooFinancials, ocResults, wikidataEntity, news] =
      await Promise.allSettled([
        tickerSymbol ? this.edgarService.getCompanyByTicker(tickerSymbol) : Promise.resolve(null),
        tickerSymbol ? this.yahooService.getQuote(tickerSymbol) : Promise.resolve(null),
        tickerSymbol ? this.yahooService.getCompanyProfile(tickerSymbol) : Promise.resolve(null),
        tickerSymbol ? this.yahooService.getFinancials(tickerSymbol) : Promise.resolve(null),
        this.openCorporatesService.searchCompanies(company.name),
        this.wikidataService.getCompanyByName(company.name),
        this.newsApiService.getCompanyNews(company.name, 30),
      ]);

    // Process SEC EDGAR data
    if (edgarData.status === 'fulfilled' && edgarData.value) {
      enrichedData.rawData.secEdgar = edgarData.value;
      enrichedData.sources.push('SEC EDGAR');

      if (!enrichedData.basic.description && edgarData.value.description) {
        enrichedData.basic.description = edgarData.value.description;
      }
    }

    // Process Yahoo Finance data
    if (yahooQuote.status === 'fulfilled' && yahooQuote.value) {
      enrichedData.rawData.yahooFinance = {
        quote: yahooQuote.value,
      };
      enrichedData.sources.push('Yahoo Finance');

      enrichedData.financial = {
        ticker: yahooQuote.value.symbol,
        exchange: yahooQuote.value.exchange,
        marketCap: yahooQuote.value.marketCap,
        price: yahooQuote.value.regularMarketPrice,
        priceChange: yahooQuote.value.regularMarketChangePercent,
      };
    }

    if (yahooProfile.status === 'fulfilled' && yahooProfile.value) {
      enrichedData.rawData.yahooFinance = {
        ...enrichedData.rawData.yahooFinance,
        profile: yahooProfile.value,
      };

      if (!enrichedData.basic.description && yahooProfile.value.description) {
        enrichedData.basic.description = yahooProfile.value.description;
      }
      if (!enrichedData.basic.sector && yahooProfile.value.sector) {
        enrichedData.basic.sector = yahooProfile.value.sector;
      }
      if (!enrichedData.basic.industry && yahooProfile.value.industry) {
        enrichedData.basic.industry = yahooProfile.value.industry;
      }
      if (!enrichedData.basic.website && yahooProfile.value.website) {
        enrichedData.basic.website = yahooProfile.value.website;
      }
    }

    if (yahooFinancials.status === 'fulfilled' && yahooFinancials.value) {
      enrichedData.rawData.yahooFinance = {
        ...enrichedData.rawData.yahooFinance,
        financials: yahooFinancials.value,
      };

      if (enrichedData.financial) {
        enrichedData.financial.revenue = yahooFinancials.value.revenue;
      }
    }

    // Process OpenCorporates data
    if (ocResults.status === 'fulfilled' && ocResults.value && ocResults.value.length > 0) {
      const firstResult = ocResults.value[0];
      enrichedData.rawData.openCorporates = firstResult;
      enrichedData.sources.push('OpenCorporates');

      enrichedData.legal = {
        jurisdiction: firstResult.jurisdiction_code,
        companyNumber: firstResult.company_number,
        registeredAddress: firstResult.registered_address
          ? `${firstResult.registered_address.locality}, ${firstResult.registered_address.region}`
          : undefined,
      };

      if (
        !enrichedData.basic.headquarters &&
        firstResult.registered_address?.locality &&
        firstResult.registered_address?.region
      ) {
        enrichedData.basic.headquarters = `${firstResult.registered_address.locality}, ${firstResult.registered_address.region}`;
      }
    }

    // Process Wikidata
    if (wikidataEntity.status === 'fulfilled' && wikidataEntity.value) {
      enrichedData.rawData.wikidata = wikidataEntity.value;
      enrichedData.sources.push('Wikidata');

      if (!enrichedData.basic.description && wikidataEntity.value.description) {
        enrichedData.basic.description = wikidataEntity.value.description;
      }
      if (!enrichedData.basic.website && wikidataEntity.value.website) {
        enrichedData.basic.website = wikidataEntity.value.website;
      }
      if (!enrichedData.basic.foundedYear && wikidataEntity.value.foundedDate) {
        const year = parseInt(wikidataEntity.value.foundedDate.substring(1, 5));
        if (!isNaN(year)) {
          enrichedData.basic.foundedYear = year;
        }
      }
    }

    // Process News
    if (news.status === 'fulfilled' && news.value && news.value.length > 0) {
      enrichedData.rawData.news = news.value;
      enrichedData.sources.push('NewsAPI');

      enrichedData.news = news.value.slice(0, 10).map((article) => ({
        title: article.title,
        source: article.source.name,
        publishedAt: article.publishedAt,
        url: article.url,
      }));
    }

    this.logger.log(
      `Enrichment complete. Sources: ${enrichedData.sources.join(', ')}`,
    );

    return enrichedData;
  }

  /**
   * Save enriched data back to the database
   */
  async saveEnrichedData(companyId: string, enrichedData: EnrichedCompanyData): Promise<void> {
    const updates: any = {};

    // Update basic fields
    if (enrichedData.basic.description) updates.description = enrichedData.basic.description;
    if (enrichedData.basic.website) updates.website = enrichedData.basic.website;
    if (enrichedData.basic.industry) updates.industry = enrichedData.basic.industry;
    if (enrichedData.basic.sector) updates.sector = enrichedData.basic.sector;
    if (enrichedData.basic.headquarters) updates.headquarters = enrichedData.basic.headquarters;
    if (enrichedData.basic.foundedYear) updates.foundedYear = enrichedData.basic.foundedYear;

    // Update financial fields
    if (enrichedData.financial) {
      if (enrichedData.financial.ticker) updates.ticker = enrichedData.financial.ticker;
      if (enrichedData.financial.exchange) updates.exchange = enrichedData.financial.exchange;
      if (enrichedData.financial.marketCap) updates.marketCap = enrichedData.financial.marketCap;
      if (enrichedData.financial.revenue) updates.revenue = enrichedData.financial.revenue;
    }

    // Store raw data
    updates.rawData = enrichedData.rawData;
    updates.lastFetched = enrichedData.lastUpdated;

    await this.prisma.company.update({
      where: { id: companyId },
      data: updates,
    });

    this.logger.log(`Saved enriched data for company: ${companyId}`);
  }

  /**
   * Check if company data is stale and needs refreshing
   * @param companyId Company database ID
   * @param maxAgeInDays Maximum age in days before data is considered stale
   */
  async isCompanyDataStale(companyId: string, maxAgeInDays: number = 30): Promise<boolean> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { lastFetched: true },
    });

    if (!company || !company.lastFetched) {
      return true; // Never fetched
    }

    const ageInMs = Date.now() - company.lastFetched.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

    return ageInDays > maxAgeInDays;
  }

  /**
   * Get list of companies with stale data
   * @param maxAgeInDays Maximum age before considered stale
   * @param limit Maximum number to return
   */
  async getStaleCompanies(maxAgeInDays: number = 30, limit: number = 100): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

    const companies = await this.prisma.company.findMany({
      where: {
        OR: [
          { lastFetched: null },
          {
            lastFetched: {
              lt: cutoffDate,
            },
          },
        ],
      },
      select: { id: true },
      take: limit,
    });

    return companies.map((c) => c.id);
  }

  /**
   * Batch enrich multiple companies
   * @param companyIds Array of company IDs
   */
  async batchEnrichCompanies(companyIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ companyId: string; error: string }>;
  }> {
    this.logger.log(`Batch enriching ${companyIds.length} companies`);

    let success = 0;
    let failed = 0;
    const errors: Array<{ companyId: string; error: string }> = [];

    for (const companyId of companyIds) {
      try {
        const enrichedData = await this.enrichCompany(companyId);
        await this.saveEnrichedData(companyId, enrichedData);
        success++;

        // Add delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        errors.push({
          companyId,
          error: error.message,
        });
        this.logger.error(`Failed to enrich company ${companyId}: ${error.message}`);
      }
    }

    this.logger.log(`Batch enrichment complete: ${success} success, ${failed} failed`);

    return { success, failed, errors };
  }
}
