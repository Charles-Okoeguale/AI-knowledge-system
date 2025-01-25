import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from './schemas/document.schema';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import * as pdfParse from 'pdf-parse';
import { InsightsService } from '../insights/insights.service';

@Injectable()
export class DocumentsService {
  private readonly insightsService: InsightsService; 

  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    insightsService: InsightsService, 
  ) {
    this.insightsService = insightsService;
  }

  async createDocument(file: Express.Multer.File, metadata: any): Promise<Document> {
    try {
      const content = await this.extractText(file);
      const { _id, ...cleanMetadata } = metadata;
      
      const newDocument = new this.documentModel({
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        content,
        metadata: cleanMetadata,
        createdAt: new Date(),
      });

      const savedDocument = await newDocument.save(); 
      await this.insightsService.generateInsights(savedDocument.id);
      return savedDocument; 
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    try {
      if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
      }
      return file.buffer.toString('utf-8');
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from file');
    }
  }
  
}