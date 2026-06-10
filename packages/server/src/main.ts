import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { FileLogger } from './common/logger/file-logger.service';

async function bootstrap() {
  const logger = new FileLogger();

  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger,
  });

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  logger.log(`Server listening on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
