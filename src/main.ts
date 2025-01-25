import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   dotenv.config()

   if (!process.env.OPENAI_API_KEY || !process.env.MONGODB_URI) {
     throw new Error('Missing required environment variables: OPENAI_API_KEY or MONGODB_URI');
   }

  const config = new DocumentBuilder()
    .setTitle('Knowledge Base API')
    .setDescription('Knowledge management system')
    .setVersion('1.0')
    .addTag('documents')
    .addTag('query')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();