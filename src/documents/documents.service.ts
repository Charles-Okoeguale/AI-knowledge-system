import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document } from './schemas/document.schema';
import { Chunk } from './schemas/chunk.schema';
import * as pdfParse from 'pdf-parse';
import { PineconeService } from '../vector/pinecone.service';
import { EmbeddingService } from 'src/vector/embedding.service';

@Injectable()
export class DocumentsService {

  constructor(
    @InjectModel(Document.name) private documentModel: Model<Document>,
    @InjectModel(Chunk.name) private chunkModel: Model<Chunk>,
    private embeddingService: EmbeddingService,
    private pineconeService: PineconeService,
  ) {
  }

  async createDocument(file: Express.Multer.File, metadata: any): Promise<Document> {
    const session = await this.documentModel.db.startSession();
    session.startTransaction();

    try {
      const content = await this.extractText(file);
      const { _id, ...cleanMetadata } = metadata;
      
      const chunks = this.chunkDocument(content);
      
      const newDocument = new this.documentModel({
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        metadata: cleanMetadata,
        chunks: [],
        totalChunks: chunks.length,
        createdAt: new Date(),
      });

      const savedDocument = await newDocument.save({ session });
      
      const savedChunks = await this.saveChunks(chunks, savedDocument.id, session);
      
      await this.generateAndStoreEmbeddings(savedChunks, savedDocument);
      
      savedDocument.chunks = savedChunks.map(chunk => chunk.id);
      await savedDocument.save({ session });
      
      await session.commitTransaction();
      return savedDocument; 
    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    } finally {
      session.endSession();
    }
  }

  private async saveChunks(chunks: Array<{ content: string; metadata: any }>, documentId: string, session: any): Promise<Chunk[]> {
    const savedChunks : any = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const newChunk = new this.chunkModel({
        parentDocumentId: documentId,
        chunkIndex: i,
        content: chunk.content,
        metadata: chunk.metadata,
        createdAt: new Date(),
      });
      
      const savedChunk = await newChunk.save({ session });
      savedChunks.push(savedChunk);
    }
    
    return savedChunks;
  }

  private async generateAndStoreEmbeddings(chunks: Chunk[], document: Document): Promise<void> {
    const chunkTexts = chunks.map(chunk => chunk.content);
    
    try {
      const embeddings = await this.embeddingService.generateEmbeddings(chunkTexts);
      const index = this.pineconeService.getIndex();
      
      const vectors = chunks.map((chunk, i) => ({
        id: chunk.id,
        values: embeddings[i],
        metadata: {
          text: chunk.content,
          documentId: document.id,
          chunkIndex: chunk.chunkIndex,
          filename: document.filename,
        }
      }));
      
      await index.upsert(vectors);
    } catch (error) {
      console.error('Error generating and storing embeddings:', error);
      throw new Error('Failed to generate and store embeddings');
    }
  }

  private chunkDocument(text: string): Array<{ content: string; metadata: any }> {
    const chunks : any = [];
    const targetChunkSize = 512;
    const overlapSize = 50;
    
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
      
      if (potentialChunk.length > targetChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: { chunkIndex, wordCount: currentChunk.split(' ').length }
        });
        
        const overlapWords = currentChunk.split(' ').slice(-overlapSize);
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { chunkIndex, wordCount: currentChunk.split(' ').length }
      });
    }
    
    return chunks;
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