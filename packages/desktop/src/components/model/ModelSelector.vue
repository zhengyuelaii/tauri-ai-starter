<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Check, ChevronDown } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const props = defineProps<{
  platforms: PlatformMeta[];
  selectedModel: string;
}>();

const emit = defineEmits<{
  select: [value: string];
}>();

const open = ref(false);

const currentPlatform = computed(() => {
  const [key] = props.selectedModel.split(':');
  return props.platforms.find((p) => p.key === key);
});

const currentModel = computed(() => {
  const [, id] = props.selectedModel.split(':');
  return currentPlatform.value?.models.find((m) => m.id === id);
});

const hasModels = computed(() =>
  props.platforms.some((p) => p.models.some((m) => m.enabled)),
);

const selectModel = (value: string) => {
  emit('select', value);
  open.value = false;
};

const { t } = useI18n();
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        :disabled="!hasModels"
        class="gap-1.5 text-[13px] font-normal h-7"
      >
        <span class="truncate max-w-[200px]">
          {{ currentPlatform?.name ?? t('model.select') }}
          <template v-if="currentModel"> / {{ currentModel.name }}</template>
        </span>
        <ChevronDown
          :size="14"
          class="opacity-50 transition-transform shrink-0"
          :class="{ 'rotate-180': open }"
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-[280px] p-0">
      <div class="max-h-[360px] overflow-y-auto p-1">
        <template v-for="p in platforms" :key="p.key">
          <template v-if="p.models.some(m => m.enabled)">
            <div
              class="text-xs text-muted-foreground px-3 py-2 font-medium uppercase tracking-wider"
            >
              {{ p.name }}
            </div>
            <button
              v-for="m in p.models"
              :key="m.id"
              v-show="m.enabled"
              class="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              :class="`${p.key}:${m.id}` === selectedModel ? 'bg-accent' : ''"
              @click="selectModel(`${p.key}:${m.id}`)"
            >
            <Check
              v-if="`${p.key}:${m.id}` === selectedModel"
              :size="14"
              class="shrink-0 opacity-70"
            />
            <span v-else class="w-[14px] shrink-0" />
            <span>{{ m.name }}</span>
          </button>
          </template>
        </template>
      </div>
    </PopoverContent>
  </Popover>
</template>
