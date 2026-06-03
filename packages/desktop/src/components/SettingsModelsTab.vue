<script setup lang="ts">
import { computed } from 'vue';
import { Check } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';
import { setModelEnabled } from '@/api';

const props = defineProps<{
  platforms: PlatformMeta[];
  refreshPlatforms: () => Promise<void>;
}>();

const enabledCount = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of props.platforms) {
    let c = 0;
    for (const m of p.models) {
      if (m.enabled) c++;
    }
    counts[p.key] = c;
  }
  return counts;
});

async function handleToggle(providerKey: string, modelId: string, enabled: boolean) {
  await setModelEnabled(providerKey, modelId, !enabled);
  await props.refreshPlatforms();
}
</script>

<template>
  <div class="space-y-5">
    <div v-for="p in platforms" :key="p.key">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {{ p.name }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ enabledCount[p.key] ?? 0 }} / {{ p.models.length }}
        </span>
      </div>
      <div class="space-y-1">
        <button
          v-for="m in p.models"
          :key="m.id"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors cursor-pointer select-none text-left"
          @click="handleToggle(p.key, m.id, m.enabled)"
        >
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="
              m.enabled
                ? 'bg-blue-700 border-blue-700'
                : 'border-gray-500'
            "
          >
            <Check
              v-if="m.enabled"
              :size="13"
              class="text-white"
              stroke-width="3"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm">{{ m.name }}</div>
            <div class="text-xs text-muted-foreground truncate">
              {{ m.modelId }}
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
