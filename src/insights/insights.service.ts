import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from '../documents/schemas/document.schema';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class InsightsService {
  private readonly openAi: OpenAIApi;

  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
  ) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openAi = new OpenAIApi(configuration);
  }

  async generateInsights(documentId: string): Promise<any> { // handle cases where the document is not found or the OpenAI API fails.
    const document = await this.documentModel.findById(documentId);
    
    if (!document) {
        throw new Error('Document not found');
    }

    const prompt = `Summarize this document and extract key insights:\n\n${document.content.substring(0, 3000)}`;
    try {
        const response = await this.openAi.createCompletion({
          model: 'gpt-3.5-turbo',
          prompt,
          max_tokens: 500,
          temperature: 0.7,
        });
    
        const insights = response.data?.choices?.[0]?.text?.trim();
        if (insights) {
          document.insights = insights;
          await document.save();
          
          return insights;
        } else {
          throw new Error('Failed to generate insights');
        }
      } catch (error) {
        console.error(error);
        throw new Error('Failed to generate insights');
    }
  }
}
