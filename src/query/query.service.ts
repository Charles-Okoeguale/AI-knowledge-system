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

      const context = this.assembleContext(searchResponse.matches);
      console.log('Assembled context:', context);

      const aiResponse = await this.generateAIResponse(context, query);
      console.log('AI Response:', aiResponse);

      return aiResponse;
      
    } catch (error) {
      console.error('Query processing error:', error);
      throw new Error(`Query processing failed: ${error.message}`);
    }
  }

  private async generateAIResponse(context: string, question: string): Promise<string> {
    try {
      const prompt = this.buildRAGPrompt(context, question);

      const response = await this.openAi.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions based on the provided context. Only use information from the context to answer questions. If the information is not in the context, say "I don\'t have enough information to answer that." Be specific and cite details from the context when possible.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No valid response content from OpenAI');
      }

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private buildRAGPrompt(context: string, question: string): string {
    return `Based on the following context, answer the question:
    Context:
    ${context}

    Question: ${question}

    Answer:`;
      }

  private assembleContext(matches: any[]): string {
    try {
      // Extract text content from matches
      const chunks = matches.map(match => ({
        text: match.metadata.text,
        score: match.score,
        documentId: match.metadata.documentId,
        chunkIndex: match.metadata.chunkIndex,
        filename: match.metadata.filename
      }));

      // Sort by relevance score (highest first)
      chunks.sort((a, b) => b.score - a.score);

      // Remove duplicates based on text content
      const uniqueChunks = chunks.filter((chunk, index, self) => 
        index === self.findIndex(c => c.text === chunk.text)
      );

      // Combine chunks into context
      const context = uniqueChunks
        .map(chunk => 
          `[Document: ${chunk.filename}, Chunk: ${chunk.chunkIndex}]\n${chunk.text}`
        )
        .join('\n\n');

      // Limit context size (approximately 4K tokens = ~16K characters)
      const maxContextLength = 16000;
      if (context.length > maxContextLength) {
        return context.substring(0, maxContextLength) + '...';
      }

      return context;
    } catch (error) {
      console.error('Error assembling context:', error);
      throw new Error('Failed to assemble context from retrieved chunks');
    }
  }
}
