<script setup lang="ts">
import type { PlatformMeta } from '@/types';
import ModelSelector from './ModelSelector.vue';

const statusLabel: Record<string, string> = {
  submitted: '已提交',
  streaming: '正在回复...',
  ready: '就绪',
  error: '出错',
};

defineProps<{
  platforms: PlatformMeta[];
  selectedModel: string;
  serverConnected: boolean;
  status: string;
  error?: Error;
}>();

const emit = defineEmits<{
  selectModel: [value: string];
}>();
</script>

<template>
  <header class="flex items-center shrink-0 border-b px-4 py-2">
    <ModelSelector
      :platforms="platforms"
      :selected-model="selectedModel"
      @select="emit('selectModel', $event)"
    />

    <div class="flex-1" />

    <!-- Connection status -->
    <div
      v-if="serverConnected"
      class="flex items-center gap-1.5 text-xs mr-3"
    >
      <span
        class="h-1.5 w-1.5 rounded-full shrink-0"
        :class="{
          'bg-blue-500': status === 'ready',
          'bg-amber-500': status === 'submitted',
          'bg-green-500 animate-pulse': status === 'streaming',
          'bg-red-500': status === 'error',
          'bg-gray-500': !status,
        }"
      />
      <span class="hidden sm:inline" :class="status === 'error' && error ? 'text-red-500' : 'text-muted-foreground'">
        {{ status === 'error' && error ? error.message : statusLabel[status] || status }}
      </span>
    </div>
    <div
      v-else
      class="flex items-center gap-1.5 text-xs text-muted-foreground mr-3"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
      <span class="hidden sm:inline">离线</span>
    </div>

    <!-- Trailing slot -->
    <slot name="trailing" />
  </header>
</template>
