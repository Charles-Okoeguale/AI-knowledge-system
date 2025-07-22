import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [
    VectorModule,
  ],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}