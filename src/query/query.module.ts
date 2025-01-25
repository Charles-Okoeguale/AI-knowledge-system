import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, DocumentSchema } from '../documents/schemas/document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }]),
  ],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}