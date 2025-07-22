import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { EmbeddingService } from '../vector/embedding.service';
import { PineconeService } from '../vector/pinecone.service';

@Injectable()
export class QueryService {
  private readonly openAi: OpenAI;

  constructor(
    private embeddingService: EmbeddingService,
    private pineconeService: PineconeService,
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

    console.log(query, "query");

    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      const index = this.pineconeService.getIndex();
      let searchResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          searchResponse = await index.query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true,
          });
          break;
        } catch (error) {
          retryCount++;
          console.error(`Pinecone search attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            throw new Error('Pinecone search failed after 3 attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      console.log('Pinecone search response:', JSON.stringify(searchResponse, null, 2));

      if (!searchResponse.matches || searchResponse.matches.length === 0) {
        return 'No relevant information found for your query. Please try rephrasing your question.';
      }

      return `Found ${searchResponse.matches.length} similar vectors. Ready for context assembly.`;
      
    } catch (error) {
      console.error('Query processing error:', error);
      throw new Error(`Query processing failed: ${error.message}`);
    }
  }
}
