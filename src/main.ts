import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as crypto from 'crypto';

// Polyfill for crypto if not available globally (for @nestjs/schedule)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto.webcrypto || crypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend requests
  app.enableCors({
    origin: true, // Allow all origins (change to specific URL in production)
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 8000);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 8000}`);
}
bootstrap();
