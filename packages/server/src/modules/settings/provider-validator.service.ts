import { Injectable } from '@nestjs/common';
import { I18nException } from '../../common/i18n/i18n.exception';

const VALIDATE_TIMEOUT_MS = 10_000;

@Injectable()
export class ProviderValidatorService {
  async validate(name: string, baseUrl: string, apiKey: string): Promise<void> {
    const url = `${baseUrl.replace(/\/$/, '')}/models`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VALIDATE_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (response.ok) return;

      const status = response.status;
      if (status === 401 || status === 403) {
        throw new I18nException(401, 'errors.providerAuthFailed', { name });
      }
      if (status === 404) {
        throw new I18nException(502, 'errors.providerModelsEndpointNotFound', { name, url });
      }
      throw new I18nException(502, 'errors.providerValidationFailed', { name, status: String(status) });
    } catch (err) {
      if (err instanceof I18nException) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new I18nException(504, 'errors.providerTimeout', { name });
      }
      throw new I18nException(502, 'errors.providerUnreachable', { name, url: baseUrl });
    } finally {
      clearTimeout(timer);
    }
  }
}
