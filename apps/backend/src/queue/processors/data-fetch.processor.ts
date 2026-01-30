import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { EdgarService } from '../../integrations/sec-edgar/edgar.service';
import { YahooFinanceService } from '../../integrations/yahoo-finance/yahoo-finance.service';
import { OpenCorporatesService } from '../../integrations/opencorporates/opencorporates.service';
import { WikidataService } from '../../integrations/wikidata/wikidata.service';

@Processor('data-fetch')
export class DataFetchProcessor {
  private readonly logger = new Logger(DataFetchProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly edgarService: EdgarService,
    private readonly yahooService: YahooFinanceService,
    private readonly openCorporatesService: OpenCorporatesService,
    private readonly wikidataService: WikidataService,
  ) {}

  @Process('fetch-company')
  async handleCompanyDataFetch(job: Job<{ companyId: string; ticker?: string }>) {
    const { companyId, ticker } = job.data;

    try {
      this.logger.log(`Processing company data fetch for: ${companyId}`);

      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error(`Company not found: ${companyId}`);
      }

      const updates: any = {};
      const rawData: any = {};

      // Fetch from Yahoo Finance if ticker available
      if (ticker || company.ticker) {
        await job.progress(25);
        const quote = await this.yahooService.getQuote(ticker || company.ticker!);
        if (quote) {
          updates.marketCap = quote.marketCap;
          rawData.yahooFinance = quote;
          this.logger.debug(`Fetched Yahoo Finance data for ${ticker}`);
        }

        const profile = await this.yahooService.getCompanyProfile(ticker || company.ticker!);
        if (profile && !company.description) {
          updates.description = profile.description;
        }
      }

      // Fetch from SEC EDGAR if public company
      if (company.type === 'PUBLIC' && (ticker || company.ticker)) {
        await job.progress(50);
        const edgarData = await this.edgarService.getCompanyByTicker(ticker || company.ticker!);
        if (edgarData) {
          rawData.secEdgar = edgarData;
          this.logger.debug(`Fetched SEC EDGAR data for ${ticker}`);
        }
      }

      // Fetch from OpenCorporates
      await job.progress(75);
      const ocResults = await this.openCorporatesService.searchCompanies(company.name);
      if (ocResults.length > 0) {
        rawData.openCorporates = ocResults[0];
        if (ocResults[0].registered_address && !company.headquarters) {
          updates.headquarters = `${ocResults[0].registered_address.locality}, ${ocResults[0].registered_address.region}`;
        }
      }

      // Fetch from Wikidata
      const wikidataEntity = await this.wikidataService.getCompanyByName(company.name);
      if (wikidataEntity) {
        rawData.wikidata = wikidataEntity;
        if (!company.description && wikidataEntity.description) {
          updates.description = wikidataEntity.description;
        }
      }

      await job.progress(100);

      // Update company with enriched data
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          ...updates,
          rawData,
          lastFetched: new Date(),
        },
      });

      this.logger.log(`Successfully enriched company: ${companyId}`);
      return { success: true, companyId, enriched: Object.keys(updates).length };
    } catch (error) {
      this.logger.error(`Error processing company ${companyId}: ${error.message}`);
      throw error;
    }
  }
}
