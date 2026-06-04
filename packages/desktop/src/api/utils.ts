export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`请求超时 (${ms / 1000}s)`);
    this.name = 'TimeoutError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 30_000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new TimeoutError(timeout);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
