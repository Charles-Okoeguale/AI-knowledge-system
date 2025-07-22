import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from './documents/documents.module';
import { QueryModule } from './query/query.module';
import { VectorModule } from './vector/vector.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://masterofwar014:14032001Birth@xxxx-database.xt8zh0z.mongodb.net/?retryWrites=true&w=majority&appName=xxxx-database'),
    DocumentsModule ,
    QueryModule,
    VectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
