import { AsyncLocalStorage } from 'node:async_hooks';

export interface LangContext {
  lang: string;
}

export const langStorage = new AsyncLocalStorage<LangContext>();
