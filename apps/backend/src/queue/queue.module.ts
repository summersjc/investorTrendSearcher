import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataFetchProcessor } from './processors/data-fetch.processor';
import { ScrapingProcessor } from './processors/scraping.processor';
import { QueueService } from './queue.service';
import { PrismaModule } from '../database/prisma.module';
import { EdgarModule } from '../integrations/sec-edgar/edgar.module';
import { YahooFinanceModule } from '../integrations/yahoo-finance/yahoo-finance.module';
import { OpenCorporatesModule } from '../integrations/opencorporates/opencorporates.module';
import { WikidataModule } from '../integrations/wikidata/wikidata.module';
import { ScrapersModule } from '../integrations/scrapers/scrapers.module';

@Module({
  imports: [
    PrismaModule,
    EdgarModule,
    YahooFinanceModule,
    OpenCorporatesModule,
    WikidataModule,
    ScrapersModule,
    BullModule.registerQueueAsync({
      name: 'data-fetch',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: 'scraping',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [QueueService, DataFetchProcessor, ScrapingProcessor],
  exports: [QueueService],
})
export class QueueModule {}
