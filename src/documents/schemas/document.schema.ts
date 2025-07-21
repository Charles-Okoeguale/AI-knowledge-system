import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';

@Schema()
export class Document extends MongoDocument {

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  contentType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: String }) 
  insights: string; 

  @Prop({ type: [String], default: [] })
  chunks: string[];

  @Prop({ default: 0 })
  totalChunks: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
DocumentSchema.index({ filename: 'text' });