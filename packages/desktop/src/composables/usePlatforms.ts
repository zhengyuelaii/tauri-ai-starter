import { ref, computed, watch, type Ref } from 'vue';
import type { SessionData } from '@/types';
import type { PlatformMeta } from '@/types';
import { fetchPlatforms } from '@/api/platforms';
import { toast } from './useToast';
import { i18n } from './useLocale';

export function usePlatforms(
  activeSessionId: Ref<string>,
  sessions: Ref<SessionData[]>,
) {
  const platforms = ref<PlatformMeta[]>([]);
  const selectedModel = ref('');
  const enableThinking = ref(false);

  const currentPlatform = computed(() => {
    const [key] = selectedModel.value.split(':');
    return platforms.value.find((p) => p.key === key);
  });

  const currentModel = computed(() => {
    const [, id] = selectedModel.value.split(':');
    return currentPlatform.value?.models.find((m) => m.id === id);
  });

  const thinkingSupported = computed(
    () => currentModel.value?.supportsThinking ?? false,
  );

  const providerLabel = computed(() => currentPlatform.value?.name ?? '');

  async function refreshPlatforms() {
    try {
      const list = await fetchPlatforms();
      platforms.value = list;
      if (list.length > 0 && !selectedModel.value) {
        const saved = localStorage.getItem('lastModel');
        if (
          saved &&
          list.some((p) => {
            const [pk, mk] = saved.split(':');
            return p.key === pk && p.models.some((m) => m.id === mk);
          })
        ) {
          selectedModel.value = saved;
        } else {
          const p = list[0];
          if (p && p.models.length > 0) {
            selectedModel.value = `${p.key}:${p.models[0]!.id}`;
          }
        }
      }
    } catch (e: any) {
      toast(i18n.global.t('providers.loadFailed') + ': ' + (e?.message || i18n.global.t('providers.unknownError')), 'error');
    }
  }

  function saveModelPref() {
    if (selectedModel.value) {
      localStorage.setItem('lastModel', selectedModel.value);
    }
  }

  watch(activeSessionId, (id) => {
    if (!id) {
      const saved = localStorage.getItem('lastModel');
      if (saved) selectedModel.value = saved;
      enableThinking.value = false;
      return;
    }
    const s = sessions.value.find((s) => s.id === id);
    if (s?.providerKey && s?.modelId) {
      selectedModel.value = `${s.providerKey}:${s.modelId}`;
      enableThinking.value = s.enableThinking ?? false;
    }
  });

  return {
    platforms,
    selectedModel,
    enableThinking,
    currentPlatform,
    currentModel,
    thinkingSupported,
    providerLabel,
    refreshPlatforms,
    saveModelPref,
  };
}
