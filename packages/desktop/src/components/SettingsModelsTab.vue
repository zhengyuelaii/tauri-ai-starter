<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Check } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';

const props = defineProps<{
  platforms: PlatformMeta[];
}>();

const enabledModels = ref(new Set<string>());

watch(
  () => props.platforms,
  (platforms) => {
    const all = new Set<string>();
    for (const p of platforms) {
      for (const m of p.models) {
        all.add(`${p.key}:${m.id}`);
      }
    }
    enabledModels.value = all;
  },
  { immediate: true },
);

const isEnabled = (providerKey: string, modelId: string) =>
  enabledModels.value.has(`${providerKey}:${modelId}`);

const toggleModel = (providerKey: string, modelId: string) => {
  const key = `${providerKey}:${modelId}`;
  const next = new Set(enabledModels.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  enabledModels.value = next;
};

// Count enabled per provider
const enabledCount = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of props.platforms) {
    let c = 0;
    for (const m of p.models) {
      if (enabledModels.value.has(`${p.key}:${m.id}`)) c++;
    }
    counts[p.key] = c;
  }
  return counts;
});
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
        <div
          v-for="m in p.models"
          :key="m.id"
          class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors cursor-pointer select-none"
          @click="toggleModel(p.key, m.id)"
        >
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="
              isEnabled(p.key, m.id)
                ? 'bg-blue-700 border-blue-700'
                : 'border-gray-500'
            "
          >
            <Check
              v-if="isEnabled(p.key, m.id)"
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
        </div>
      </div>
    </div>
  </div>
</template>
