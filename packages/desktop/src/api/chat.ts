import { fetchWithTimeout } from './utils';
import { i18n } from '@/composables/useLocale';

export async function generateTitle(
  provider: string,
  model: string,
  message: string,
): Promise<string> {
  const res = await fetchWithTimeout(`/api/chat/generate-title`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, message }),
  });
  if (!res.ok) {
    throw new Error(i18n.global.t('api.generateTitleFailed'));
  }
  const data = (await res.json()) as { title: string };
  return data.title;
}
