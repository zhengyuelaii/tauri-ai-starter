import { BASE_URL } from './constants';
import { fetchWithTimeout } from './utils';
import { i18n } from '@/composables/useLocale';
import type { ModelDef } from '@/types';

export interface ProviderItem {
  key: string;
  name: string;
  connected: boolean;
  hasApiKey: boolean;
  baseUrl: string | null;
  isCustom: boolean;
}

export async function fetchSettingsProviders() {
  const res = await fetchWithTimeout(`${BASE_URL}/api/settings/providers`);
  return (await res.json()) as { providers: ProviderItem[] };
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

export interface CustomProviderPayload {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: ModelDef[];
}

export async function createCustomProvider(payload: CustomProviderPayload) {
  const res = await fetchWithTimeout(`${BASE_URL}/api/settings/providers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? i18n.global.t('providers.createFailed'));
  }
  return (await res.json()) as { key: string };
}

export async function updateCustomProvider(
  key: string,
  payload: Partial<CustomProviderPayload>,
) {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/settings/providers/${key}/custom`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? i18n.global.t('providers.updateFailed'));
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
