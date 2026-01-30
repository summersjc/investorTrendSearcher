import { Module } from '@nestjs/common';
import { BaseModule } from './base/base.module';
import { EdgarModule } from './sec-edgar/edgar.module';
import { YahooFinanceModule } from './yahoo-finance/yahoo-finance.module';
import { OpenCorporatesModule } from './opencorporates/opencorporates.module';
import { WikidataModule } from './wikidata/wikidata.module';
import { NewsApiModule } from './newsapi/newsapi.module';
import { ScrapersModule } from './scrapers/scrapers.module';

@Module({
  imports: [
    BaseModule,
    EdgarModule,
    YahooFinanceModule,
    OpenCorporatesModule,
    WikidataModule,
    NewsApiModule,
    ScrapersModule,
  ],
  exports: [
    BaseModule,
    EdgarModule,
    YahooFinanceModule,
    OpenCorporatesModule,
    WikidataModule,
    NewsApiModule,
    ScrapersModule,
  ],
})
export class IntegrationsModule {}
