import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { EdgarModule } from '../../integrations/sec-edgar/edgar.module';
import { YahooFinanceModule } from '../../integrations/yahoo-finance/yahoo-finance.module';
import { OpenCorporatesModule } from '../../integrations/opencorporates/opencorporates.module';
import { WikidataModule } from '../../integrations/wikidata/wikidata.module';
import { NewsApiModule } from '../../integrations/newsapi/newsapi.module';
import { ScrapersModule } from '../../integrations/scrapers/scrapers.module';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [
    EdgarModule,
    YahooFinanceModule,
    OpenCorporatesModule,
    WikidataModule,
    NewsApiModule,
    ScrapersModule,
    QueueModule,
  ],
  controllers: [TestController],
})
export class TestModule {}
