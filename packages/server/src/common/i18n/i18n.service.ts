import { Injectable } from '@nestjs/common';
import zhCN from './locales/zh-CN';
import en from './locales/en';
import { langStorage } from './lang-storage';

export type SupportedLocale = 'zh-CN' | 'en';

interface LocaleData {
  errors: Record<string, string>;
  prompts: Record<string, string>;
  session: Record<string, string>;
}

@Injectable()
export class I18nService {
  private readonly locales = new Map<SupportedLocale, LocaleData>();
  private readonly defaultLocale: SupportedLocale = 'en';

  constructor() {
    this.locales.set('zh-CN', zhCN);
    this.locales.set('en', en);
  }

  currentLang(): string {
    return langStorage.getStore()?.lang ?? 'zh-CN';
  }

  t(key: string, lang: string, params?: Record<string, string>): string {
    const locale = this.locales.get(lang as SupportedLocale) ?? this.locales.get(this.defaultLocale)!;
    const [section, ...rest] = key.split('.');
    const subKey = rest.join('.');

    let value: string | undefined;
    if (section === 'errors') value = locale.errors[subKey];
    else if (section === 'prompts') value = locale.prompts[subKey];
    else if (section === 'session') value = locale.session[subKey];

    if (!value) {
      const fallback = this.locales.get(this.defaultLocale)!;
      if (section === 'errors') value = fallback.errors[subKey];
      else if (section === 'prompts') value = fallback.prompts[subKey];
      else if (section === 'session') value = fallback.session[subKey];
    }

    if (!value) return key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, v);
      }
    }
    return value;
  }
}
