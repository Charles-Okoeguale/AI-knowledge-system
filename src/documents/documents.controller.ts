import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { Document } from './schemas/document.schema';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Body() metadata: any): Promise<Document> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      return await this.documentsService.createDocument(file, metadata);
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload document');
    }
  }
}
