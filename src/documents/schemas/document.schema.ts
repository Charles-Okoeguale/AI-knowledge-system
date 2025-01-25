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

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: String }) 
  insights: string; 

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
DocumentSchema.index({ content: 'text', insights: 'text' });