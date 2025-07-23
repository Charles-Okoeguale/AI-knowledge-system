import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from './documents/documents.module';
import { QueryModule } from './query/query.module';
import { VectorModule } from './vector/vector.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    DocumentsModule ,
    QueryModule,
    VectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
