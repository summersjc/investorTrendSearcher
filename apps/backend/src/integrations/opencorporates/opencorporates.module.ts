import { Module } from '@nestjs/common';
import { OpenCorporatesService } from './opencorporates.service';

@Module({
  providers: [OpenCorporatesService],
  exports: [OpenCorporatesService],
})
export class OpenCorporatesModule {}
