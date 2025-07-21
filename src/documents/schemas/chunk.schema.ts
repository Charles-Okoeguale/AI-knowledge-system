import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';

@Schema()
export class Chunk extends MongoDocument {
  @Prop({ required: true })
  parentDocumentId: string;

  @Prop({ required: true })
  chunkIndex: number;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ChunkSchema = SchemaFactory.createForClass(Chunk);
ChunkSchema.index({ content: 'text', insights: 'text' });
ChunkSchema.index({ parentDocumentId: 1, chunkIndex: 1 });