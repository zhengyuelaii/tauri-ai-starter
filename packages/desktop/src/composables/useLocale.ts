import { createI18n } from 'vue-i18n';
import zhCN from '@/locales/zh-CN.json';
import en from '@/locales/en.json';

export type Locale = 'zh-CN' | 'en';

const STORAGE_KEY = 'nativai-locale';
const DEFAULT_LOCALE: Locale = 'zh-CN';

function getSavedLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : DEFAULT_LOCALE;
}

const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, en },
});

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
}

export function toggleLocale() {
  const next = i18n.global.locale.value === 'zh-CN' ? 'en' : 'zh-CN';
  setLocale(next);
}

export { i18n };
