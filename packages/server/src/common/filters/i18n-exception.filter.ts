import { ExceptionFilter, Catch, ArgumentsHost, Injectable, Logger } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nService } from '../i18n/i18n.service';
import { I18nException } from '../i18n/i18n.exception';
import { langStorage } from '../i18n/lang-storage';

@Injectable()
@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const store = langStorage.getStore();
    const lang = store?.lang ?? (req.headers['x-language'] as string) ?? 'zh-CN';

    if (exception instanceof I18nException) {
      const message = this.i18n.t(exception.i18nKey, lang, exception.i18nParams);
      res.status(exception.getStatus()).json({ error: message, statusCode: exception.getStatus() });
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      let message: string;
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        message = (body as Record<string, unknown>).message as string || exception.message;
      } else {
        message = exception.message;
      }
      res.status(statusCode).json({ error: message, statusCode });
      return;
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    res.status(500).json({ error: 'Internal Server Error', statusCode: 500 });
  }
}
