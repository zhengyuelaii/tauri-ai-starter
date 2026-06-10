import type { PlatformMeta } from '@/types';
import { fetchWithTimeout } from './utils';

export async function fetchPlatforms(): Promise<PlatformMeta[]> {
  const res = await fetchWithTimeout(`/api/platforms`);
  const data = (await res.json()) as { platforms: PlatformMeta[] };
  return data.platforms;
}
