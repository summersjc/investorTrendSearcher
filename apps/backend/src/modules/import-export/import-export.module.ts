import { Module } from '@nestjs/common';
import { ImportExportService } from './import-export.service';
import { ImportExportController } from './import-export.controller';
import { InvestorModule } from '../investor/investor.module';
import { CompanyModule } from '../company/company.module';
import { InvestmentModule } from '../investment/investment.module';

@Module({
  imports: [InvestorModule, CompanyModule, InvestmentModule],
  providers: [ImportExportService],
  controllers: [ImportExportController],
  exports: [ImportExportService],
})
export class ImportExportModule {}
