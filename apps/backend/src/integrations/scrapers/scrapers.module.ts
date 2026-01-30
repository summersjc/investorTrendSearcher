import { Module } from '@nestjs/common';
import { InvestorPortfolioScraper } from './investor-portfolio-scraper';

@Module({
  providers: [InvestorPortfolioScraper],
  exports: [InvestorPortfolioScraper],
})
export class ScrapersModule {}
