import type { PlatformMeta } from '@/types';
import { BASE_URL } from './constants';
import { fetchWithTimeout } from './utils';

export async function fetchPlatforms(): Promise<PlatformMeta[]> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/platforms`);
  const data = (await res.json()) as { platforms: PlatformMeta[] };
  return data.platforms;
}
