import { HttpException } from '@nestjs/common';

export class I18nException extends HttpException {
  readonly i18nKey: string;
  readonly i18nParams: Record<string, string>;

  constructor(statusCode: number, i18nKey: string, params: Record<string, string> = {}) {
    super(i18nKey, statusCode);
    this.i18nKey = i18nKey;
    this.i18nParams = params;
  }
}
