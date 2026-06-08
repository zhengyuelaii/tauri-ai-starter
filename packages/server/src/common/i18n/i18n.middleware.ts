import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { langStorage } from './lang-storage';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const lang = (req.headers['x-language'] as string) || 'zh-CN';
    langStorage.run({ lang }, () => next());
  }
}
