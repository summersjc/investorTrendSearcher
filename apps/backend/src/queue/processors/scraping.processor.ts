import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { InvestorPortfolioScraper } from '../../integrations/scrapers/investor-portfolio-scraper';

@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolioScraper: InvestorPortfolioScraper,
  ) {}

  @Process('scrape-portfolio')
  async handlePortfolioScraping(
    job: Job<{ investorId: string; url: string; investorName?: string }>,
  ) {
    const { investorId, url, investorName } = job.data;

    try {
      this.logger.log(`Processing portfolio scraping for: ${investorName || investorId}`);

      // Create scraping job record
      const scrapingJob = await this.prisma.scrapingJob.create({
        data: {
          url,
          status: 'RUNNING',
          investorId,
          startedAt: new Date(),
        },
      });

      await job.progress(10);

      // Perform scraping
      const result = await this.portfolioScraper.scrapePortfolio(investorName || url);

      await job.progress(80);

      if (result.success) {
        this.logger.log(`Successfully scraped ${result.companies.length} companies`);

        // Update scraping job with results
        await this.prisma.scrapingJob.update({
          where: { id: scrapingJob.id },
          data: {
            status: 'COMPLETED',
            result: result as any,
            completedAt: new Date(),
          },
        });

        // Create or update portfolio companies
        for (const company of result.companies) {
          try {
            // Check if company exists
            let dbCompany = await this.prisma.company.findFirst({
              where: {
                OR: [
                  { name: company.name },
                  company.website ? { website: company.website } : {},
                ],
              },
            });

            // Create company if it doesn't exist
            if (!dbCompany) {
              dbCompany = await this.prisma.company.create({
                data: {
                  name: company.name,
                  slug: this.slugify(company.name),
                  type: 'PRIVATE', // Default to private
                  website: company.website,
                  description: company.description,
                  logoUrl: company.logoUrl,
                  dataSource: 'WEB_SCRAPING',
                },
              });
            }

            // Create portfolio company entry
            await this.prisma.portfolioCompany.upsert({
              where: {
                investorId_companyId: {
                  investorId,
                  companyId: dbCompany.id,
                },
              },
              create: {
                investorId,
                companyId: dbCompany.id,
                status: 'ACTIVE',
              },
              update: {
                status: 'ACTIVE',
              },
            });
          } catch (error) {
            this.logger.warn(`Error creating company ${company.name}: ${error.message}`);
          }
        }

        await job.progress(100);

        return {
          success: true,
          companiesFound: result.companies.length,
          investorId,
        };
      } else {
        // Update scraping job with failure
        await this.prisma.scrapingJob.update({
          where: { id: scrapingJob.id },
          data: {
            status: 'FAILED',
            error: result.error,
            completedAt: new Date(),
          },
        });

        throw new Error(result.error || 'Scraping failed');
      }
    } catch (error) {
      this.logger.error(`Error scraping portfolio for ${investorId}: ${error.message}`);
      throw error;
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
