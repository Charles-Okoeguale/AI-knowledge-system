import { Body, Controller, Post } from '@nestjs/common';
import { QueryService } from './query.service';
import { IsOptional, IsArray, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class DateRangeDto {
  @IsDateString()
  start: string;

  @IsDateString()
  end: string;
}

class QueryFiltersDto {
  @IsOptional()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  author?: string;
}

class QueryDto {
  @IsString()
  question: string;

  @IsOptional()
  @Type(() => QueryFiltersDto)
  filters?: QueryFiltersDto;
}

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post() // query endpoint
  async processQuery(@Body() queryDto: QueryDto): Promise<string> {
    const filters = queryDto.filters ? {
      ...queryDto.filters,
      dateRange: queryDto.filters.dateRange ? {
        start: new Date(queryDto.filters.dateRange.start),
        end: new Date(queryDto.filters.dateRange.end)
      } : undefined
    } : undefined;

    return this.queryService.processQuery(
      queryDto.question,
      filters
    );
  }
}