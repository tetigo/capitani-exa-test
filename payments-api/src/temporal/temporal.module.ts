import { Module } from '@nestjs/common';
import { TemporalClientService } from './temporalClient.service';

@Module({
  providers: [TemporalClientService],
  exports: [TemporalClientService],
})
export class TemporalModule {}


