import { Module } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorController } from './investor.controller';
import { WikidataModule } from '../../integrations/wikidata/wikidata.module';

@Module({
  imports: [WikidataModule],
  providers: [InvestorService],
  controllers: [InvestorController],
  exports: [InvestorService],
})
export class InvestorModule {}
