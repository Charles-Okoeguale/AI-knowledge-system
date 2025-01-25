import { Controller, Post, Body } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  async processQuery(@Body('query') query: string): Promise<string> {
    return this.queryService.processQuery(query);
  }
}