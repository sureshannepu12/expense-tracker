import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Global app configuration shared by main.ts and the e2e tests. */
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get('CORS_ORIGIN', 'http://localhost:5173'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that aren't in the DTO
      forbidNonWhitelisted: true, // ...and reject the request if any were sent
      transform: true, // turn plain JSON into DTO class instances (applies defaults + @Type)
    }),
  );
}
