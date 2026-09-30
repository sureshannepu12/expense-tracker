import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { buildOpenApiDocument } from './swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('docs', app, document); // UI at /docs, JSON at /docs-json

  if (process.env.NODE_ENV !== 'production') {
    // The frontend's Orval config reads this file to generate the API client.
    const file = resolve(process.cwd(), 'openapi.json');
    writeFileSync(file, JSON.stringify(document, null, 2));
    Logger.log(`OpenAPI spec written to ${file}`, 'Swagger');
  }

  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`API ready at http://localhost:${port}/docs`, 'Bootstrap');
}
await bootstrap();
