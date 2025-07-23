import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (!process.env.OPENAI_API_KEY || !process.env.MONGODB_URI || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    throw new Error('Missing required environment variables: OPENAI_API_KEY, MONGODB_URI, PINECONE_API_KEY, or PINECONE_INDEX_NAME');
  }

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();