import { Global, Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { I18nService } from './i18n.service';
import { I18nMiddleware } from './i18n.middleware';
import { I18nExceptionFilter } from '../filters/i18n-exception.filter';

@Global()
@Module({
  providers: [
    I18nService,
    { provide: APP_FILTER, useClass: I18nExceptionFilter },
  ],
  exports: [I18nService],
})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware).forRoutes({ path: '/api/*path', method: RequestMethod.ALL });
  }
}
