import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { InsightsService } from './insights.service';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Post()
  async generateInsights(@Body('documentId') documentId: string): Promise<any> {
    if (!documentId) {
      throw new BadRequestException('Document ID is required');
    }
    return this.insightsService.generateInsights(documentId);
  }
}