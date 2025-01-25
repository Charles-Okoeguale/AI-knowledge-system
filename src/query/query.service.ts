import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from '../documents/schemas/document.schema';

@Injectable()
export class QueryService {
  private readonly openAi: OpenAIApi;

  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
  ) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openAi = new OpenAIApi(configuration);
  }

  async processQuery(query: string): Promise<string> {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query: Query must be a non-empty string.');
    }

    let relevantDocs;
    try {
      relevantDocs = await this.documentModel
        .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
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
      .map(doc => `Document: ${doc.filename}\nContent: ${doc.content.substring(0, 1000)}...`)
      .join('\n\n');

    const prompt = `Based on the following context, answer the question:\n\n
    Context:\n${context}\n\n
    Question: ${query}\nAnswer:`;

    try {
      const response = await this.openAi.createCompletion({
        model: 'gpt-3.5-turbo',
        prompt,
        max_tokens: 1000,
        temperature: 0.5,
      });

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('No choices returned from OpenAI API');
      }

      const choiceText = response.data.choices[0].text?.trim() || 'No response available';
      return choiceText;
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      throw new Error('Failed to process query with OpenAI API.');
    }
  }
}