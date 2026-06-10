import { i18n } from '@/composables/useLocale';
import { BASE_URL } from './constants';

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`${i18n.global.t('api.timeout')} (${ms / 1000}s)`);
    this.name = 'TimeoutError';
  }
}

export async function fetchWithTimeout(
  path: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 30_000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener('abort', () => controller.abort());
  }

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('X-Language')) {
    headers.set('X-Language', i18n.global.locale.value as string);
  }

  const url = import.meta.env.DEV ? path : `${BASE_URL}${path}`;

  try {
    return await fetch(url, { ...fetchOptions, headers, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new TimeoutError(timeout);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
