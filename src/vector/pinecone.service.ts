import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';

@Injectable()
export class PineconeService implements OnModuleInit {
  private pinecone: Pinecone;
  private index: any;

  async onModuleInit() {
    await this.initializePinecone();
  }

  private async initializePinecone() {
    try {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || "",
      });

      this.index = this.pinecone.index(process.env.PINECONE_INDEX_NAME || "");
      
      console.log('Pinecone connection established successfully');
    } catch (error) {
      console.error('Failed to initialize Pinecone:', error);
      throw new Error('Pinecone initialization failed');
    }
  }

  getIndex() {
    return this.index;
  }
}