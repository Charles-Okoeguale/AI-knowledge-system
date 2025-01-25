import { Injectable } from '@nestjs/common';
import OpenAI from 'openai'; 
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from '../documents/schemas/document.schema';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class InsightsService {
  private readonly openai: OpenAI;

  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
  ) {

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateInsights(documentId: string): Promise<any> {
   
    const document = await this.documentModel.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

   
    const prompt = `Summarize this document and extract key insights:\n\n${document.content.substring(0, 3000)}`;

    try {

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', 
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      
      const insights = response.choices?.[0]?.message?.content?.trim();
      if (insights) {
        
        document.insights = insights;
        await document.save();

        return insights;
      } else {
        throw new Error('Failed to generate insights: No content returned');
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate insights');
    }
  }
}