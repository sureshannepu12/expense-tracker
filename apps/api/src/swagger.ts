import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Expense Tracker API')
    .setDescription(
      'REST API for the expense tracker. All amounts are integers in cents/paise.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config, {
    // Use the controller method name as operationId (e.g. "findAllExpenses"),
    // so Orval generates hooks like useFindAllExpenses().
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
}
