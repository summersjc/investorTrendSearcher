import { Module } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { InvestmentController } from './investment.controller';

@Module({
  providers: [InvestmentService],
  controllers: [InvestmentController],
  exports: [InvestmentService],
})
export class InvestmentModule {}
