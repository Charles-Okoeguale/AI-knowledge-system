import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   dotenv.config()

   if (!process.env.OPENAI_API_KEY || !process.env.MONGODB_URI) {
     throw new Error('Missing required environment variables: OPENAI_API_KEY or MONGODB_URI');
   }

  await app.listen(3000);
}
bootstrap();