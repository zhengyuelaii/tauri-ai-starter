<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { PanelLeft } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';
import ModelSelector from '../model/ModelSelector.vue';
import { Button } from '@/components/ui/button';

const isMacOS = navigator.userAgent.includes('Mac');

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
  toggleSidebar: [];
}>();

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    'button, a, input, textarea, select, [role="button"], [role="menuitem"], [contenteditable]',
  );
}

async function handleDrag(e: MouseEvent) {
  if (e.buttons !== 1) return;
  if (isInteractive(e.target)) return;
  e.preventDefault();
  await getCurrentWindow().startDragging().catch(() => undefined);
}

async function handleDblClick(e: MouseEvent) {
  if (isInteractive(e.target)) return;
  e.preventDefault();
  await getCurrentWindow().toggleMaximize().catch(() => undefined);
}
</script>

<template>
  <header
    class="h-10 shrink-0 bg-background/70 backdrop-blur-sm border-b border-border/40
           grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center"
    @mousedown="handleDrag"
    @dblclick="handleDblClick"
  >
    <!-- LEFT -->
    <div class="flex items-center min-w-0">
      <div v-if="isMacOS" class="h-full shrink-0" style="width: 72px" />
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
        title="切换侧边栏"
        @click="emit('toggleSidebar')"
      >
        <PanelLeft :size="18" />
      </Button>
    </div>

    <!-- CENTER -->
    <div class="min-w-0 flex items-center justify-center pointer-events-none">
      <div class="pointer-events-auto" />
    </div>

    <!-- RIGHT -->
    <div class="flex items-center justify-end min-w-0 gap-2 px-4">
      <ModelSelector
        :platforms="platforms"
        :selected-model="selectedModel"
        @select="emit('selectModel', $event)"
      />

      <div
        v-if="serverConnected"
        class="flex items-center gap-1.5 text-xs"
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
        class="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
        <span class="hidden sm:inline">离线</span>
      </div>
    </div>
  </header>
</template>
