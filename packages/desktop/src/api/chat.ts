import { BASE_URL } from './constants';
import { fetchWithTimeout } from './utils';

export async function generateTitle(
  provider: string,
  model: string,
  message: string,
): Promise<string> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/chat/generate-title`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, message }),
  });
  if (!res.ok) {
    throw new Error('生成标题失败');
  }
  const data = (await res.json()) as { title: string };
  return data.title;
}
