import { BASE_URL } from './constants';
import { fetchWithTimeout } from './utils';
import { i18n } from '@/composables/useLocale';

export async function fetchSettingsProviders() {
  const res = await fetchWithTimeout(`${BASE_URL}/api/settings/providers`);
  return (await res.json()) as {
    providers: Array<{
      key: string;
      name: string;
      connected: boolean;
      hasApiKey: boolean;
      baseUrl: string | null;
    }>;
  };
}

export async function connectProvider(
  key: string,
  apiKey: string,
  baseUrl?: string,
) {
  const res = await fetchWithTimeout(`${BASE_URL}/api/settings/providers/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, baseUrl }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? i18n.global.t('providers.connectFailed'));
  }
}

export async function disconnectProvider(key: string) {
  const res = await fetchWithTimeout(`${BASE_URL}/api/settings/providers/${key}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? i18n.global.t('providers.disconnectFailed'));
  }
}

export async function setModelEnabled(
  providerKey: string,
  modelId: string,
  enabled: boolean,
) {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/settings/models/${providerKey}/${modelId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    },
  );
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? i18n.global.t('models.setFailed'));
  }
}
