import { Module } from '@nestjs/common';
import { EdgarService } from './edgar.service';

@Module({
  providers: [EdgarService],
  exports: [EdgarService],
})
export class EdgarModule {}
