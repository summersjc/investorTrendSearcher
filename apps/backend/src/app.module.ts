import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { CacheModule } from './cache/cache.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { QueueModule } from './queue/queue.module';
import { TestModule } from './modules/test/test.module';
import { AggregationModule } from './modules/aggregation/aggregation.module';
import { InvestorModule } from './modules/investor/investor.module';
import { CompanyModule } from './modules/company/company.module';
import { InvestmentModule } from './modules/investment/investment.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Queue system
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Core modules
    PrismaModule,
    CacheModule,

    // Phase 2: Integrations
    IntegrationsModule,
    QueueModule,
    TestModule,

    // Phase 3: Services
    AggregationModule,
    InvestorModule,
    CompanyModule,
    InvestmentModule,
    ConnectionsModule,
    ImportExportModule,

    // Phase 4: API Endpoints
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
