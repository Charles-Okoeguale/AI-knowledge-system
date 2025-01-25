import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';

@Schema()
export class Document extends MongoDocument {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ unique: true, required: true })
  filename: string;

  @Prop({ required: true })
  contentType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  insights: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
DocumentSchema.index({ content: 'text', insights: 'text' });