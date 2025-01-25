import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from './schemas/document.schema';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
  ) {}

  async createDocument(file: Express.Multer.File, metadata: any): Promise<Document> {
    try {
      const content = await this.extractText(file);
      console.log(content, "content of the file");
      
      const newDocument = new this.documentModel({
        id: uuidv4(),
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        content,
        metadata,
        createdAt: new Date(),
      });
      
      console.log(newDocument, 'newDocument');

      return newDocument.save();
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