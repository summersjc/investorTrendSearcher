import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EdgarService } from '../../integrations/sec-edgar/edgar.service';
import { YahooFinanceService } from '../../integrations/yahoo-finance/yahoo-finance.service';
import { OpenCorporatesService } from '../../integrations/opencorporates/opencorporates.service';
import { WikidataService } from '../../integrations/wikidata/wikidata.service';
import { NewsApiService } from '../../integrations/newsapi/newsapi.service';
import { InvestorPortfolioScraper } from '../../integrations/scrapers/investor-portfolio-scraper';
import { QueueService } from '../../queue/queue.service';

@ApiTags('test')
@Controller('test')
export class TestController {
  constructor(
    private readonly edgarService: EdgarService,
    private readonly yahooService: YahooFinanceService,
    private readonly openCorporatesService: OpenCorporatesService,
    private readonly wikidataService: WikidataService,
    private readonly newsApiService: NewsApiService,
    private readonly portfolioScraper: InvestorPortfolioScraper,
    private readonly queueService: QueueService,
  ) {}

  @Get('sec-edgar')
  @ApiOperation({ summary: 'Test SEC EDGAR integration' })
  @ApiQuery({ name: 'ticker', example: 'AAPL' })
  async testEdgar(@Query('ticker') ticker: string) {
    const company = await this.edgarService.getCompanyByTicker(ticker);
    const filings = company ? await this.edgarService.getRecentFilings(company.cik, null, 5) : [];

    return {
      integration: 'SEC EDGAR',
      ticker,
      company: company ? { cik: company.cik, name: company.name, tickers: company.tickers } : null,
      recentFilings: filings.length,
      success: !!company,
    };
  }

  @Get('yahoo-finance')
  @ApiOperation({ summary: 'Test Yahoo Finance integration' })
  @ApiQuery({ name: 'ticker', example: 'AAPL' })
  async testYahoo(@Query('ticker') ticker: string) {
    const quote = await this.yahooService.getQuote(ticker);
    const profile = await this.yahooService.getCompanyProfile(ticker);

    return {
      integration: 'Yahoo Finance',
      ticker,
      quote: quote
        ? {
            price: quote.regularMarketPrice,
            marketCap: quote.marketCap,
            change: quote.regularMarketChangePercent,
          }
        : null,
      profile: profile
        ? { name: profile.name, sector: profile.sector, industry: profile.industry }
        : null,
      success: !!quote,
    };
  }

  @Get('opencorporates')
  @ApiOperation({ summary: 'Test OpenCorporates integration' })
  @ApiQuery({ name: 'name', example: 'Apple Inc' })
  async testOpenCorporates(@Query('name') name: string) {
    const companies = await this.openCorporatesService.searchCompanies(name);

    return {
      integration: 'OpenCorporates',
      query: name,
      resultsFound: companies.length,
      companies: companies.slice(0, 3).map((c) => ({
        name: c.name,
        jurisdiction: c.jurisdiction_code,
        number: c.company_number,
        status: c.current_status,
      })),
      success: companies.length > 0,
    };
  }

  @Get('wikidata')
  @ApiOperation({ summary: 'Test Wikidata integration' })
  @ApiQuery({ name: 'name', example: 'Apple Inc' })
  async testWikidata(@Query('name') name: string) {
    const entity = await this.wikidataService.getCompanyByName(name);

    return {
      integration: 'Wikidata',
      query: name,
      entity: entity
        ? {
            id: entity.id,
            label: entity.label,
            description: entity.description,
            founded: entity.foundedDate,
            industry: entity.industry,
          }
        : null,
      success: !!entity,
    };
  }

  @Get('newsapi')
  @ApiOperation({ summary: 'Test NewsAPI integration' })
  @ApiQuery({ name: 'company', example: 'Apple' })
  async testNewsApi(@Query('company') company: string) {
    const news = await this.newsApiService.getCompanyNews(company, 7);

    return {
      integration: 'NewsAPI',
      company,
      articlesFound: news.length,
      articles: news.slice(0, 3).map((a) => ({
        title: a.title,
        source: a.source.name,
        publishedAt: a.publishedAt,
      })),
      success: news.length > 0,
    };
  }

  @Post('scraping')
  @ApiOperation({ summary: 'Test portfolio scraping' })
  async testScraping(
    @Body() body: { url: string; investorName?: string },
  ) {
    const result = await this.portfolioScraper.scrapePortfolio(body.investorName || body.url);

    return {
      integration: 'Portfolio Scraper',
      url: body.url,
      ...result,
      companies: result.companies.slice(0, 5), // Return first 5 for preview
    };
  }

  @Get('queue-stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  async getQueueStats() {
    const dataFetchStats = await this.queueService.getQueueStats('data-fetch');
    const scrapingStats = await this.queueService.getQueueStats('scraping');

    return {
      dataFetch: dataFetchStats,
      scraping: scrapingStats,
    };
  }

  @Get('all')
  @ApiOperation({ summary: 'Test all integrations at once' })
  @ApiQuery({ name: 'ticker', example: 'AAPL' })
  @ApiQuery({ name: 'company', example: 'Apple Inc' })
  async testAll(@Query('ticker') ticker: string, @Query('company') company: string) {
    const [edgar, yahoo, openCorp, wikidata, news] = await Promise.all([
      this.edgarService.getCompanyByTicker(ticker).catch(() => null),
      this.yahooService.getQuote(ticker).catch(() => null),
      this.openCorporatesService.searchCompanies(company).catch(() => []),
      this.wikidataService.getCompanyByName(company).catch(() => null),
      this.newsApiService.getCompanyNews(company, 7).catch(() => []),
    ]);

    return {
      summary: {
        ticker,
        company,
        timestamp: new Date().toISOString(),
      },
      integrations: {
        secEdgar: { working: !!edgar, data: edgar ? 'Found' : 'Not found' },
        yahooFinance: { working: !!yahoo, price: yahoo?.regularMarketPrice },
        openCorporates: { working: openCorp.length > 0, results: openCorp.length },
        wikidata: { working: !!wikidata, found: !!wikidata },
        newsApi: { working: news.length > 0, articles: news.length },
      },
      allWorking:
        !!edgar && !!yahoo && openCorp.length > 0 && !!wikidata && news.length > 0,
    };
  }
}
