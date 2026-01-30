import { Module } from '@nestjs/common';
import { AggregationService } from './aggregation.service';
import { IntegrationsModule } from '../../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
