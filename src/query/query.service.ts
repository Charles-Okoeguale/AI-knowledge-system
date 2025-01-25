import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from '../documents/schemas/document.schema';

@Injectable()
export class QueryService {
  private readonly openAi: OpenAI;

  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
  ) {
    this.openAi = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processQuery(
    query: string,
    filters?: {
      dateRange?: { start: Date; end: Date };
      categories?: string[];
      author?: string;
    }
  ): Promise<string> {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query: Query must be a non-empty string.');
    }

    const filterConditions: Record<string, any> = {};

    if (filters?.dateRange) {
      if (!(filters.dateRange.start instanceof Date) || !(filters.dateRange.end instanceof Date)) {
        throw new Error('Invalid date range format. Use ISO date strings.');
      }
      filterConditions['createdAt'] = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    if (filters?.categories?.length) {
      filterConditions['metadata.category'] = {
        $in: filters.categories
      };
    }
  
    if (filters?.author) {
      filterConditions['metadata.author'] = filters.author;
    }

    let relevantDocs;
    console.log(query, "query")

    try {
      relevantDocs = await this.documentModel
        .find({ $text: { $search: query }, ...filterConditions }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(3)
        .exec();
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw new Error('Failed to retrieve documents from the database.');
    }

    if (relevantDocs.length === 0) {
      throw new Error('No relevant documents found for the given query.');
    }

    const context = relevantDocs
    .map(doc => 
      `Document: ${doc.filename}\n` +
      `Content: ${doc.content.substring(0, 500)}...\n` +
      `Insights: ${doc.insights || "No insights available"}` 
    )
    .join('\n\n');

    const prompt = `Based on the following context, answer the question:\n\n
    Context:\n${context}\n\n
    Question: ${query}\nAnswer:`;

    try {
      const response = await this.openAi.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 1000,
        temperature: 0.5,
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No valid response content from OpenAI');
      }

      return response.choices[0].message.content.trim();
    } catch (apiError) {
      console.error('OpenAI API error details:', {
        code: apiError.code,
        status: apiError.status,
        message: apiError.message
      });
      throw new Error(`OpenAI API error: ${apiError.message}`);
    }
  }
}