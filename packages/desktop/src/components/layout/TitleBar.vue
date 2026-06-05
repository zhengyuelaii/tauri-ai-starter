<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useI18n } from 'vue-i18n';
import { PanelLeft } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';
import ModelSelector from '../model/ModelSelector.vue';
import { Button } from '@/components/ui/button';
import { ref } from 'vue';
import { toggleLocale } from '@/composables/useLocale';

const { t, locale } = useI18n();
const isMacOS = navigator.userAgent.includes('Mac');
const localeSwitching = ref(false);

function handleToggleLocale() {
  if (localeSwitching.value) return;
  localeSwitching.value = true;
  toggleLocale();
  setTimeout(() => { localeSwitching.value = false; }, 300);
}

defineProps<{
  platforms: PlatformMeta[];
  selectedModel: string;
  serverConnected: boolean;
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
        :title="t('titlebar.toggleSidebar')"
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

      <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          class="h-1.5 w-1.5 rounded-full shrink-0"
          :class="serverConnected ? 'bg-green-500' : 'bg-gray-500'"
        />
        <span class="hidden sm:inline">{{ serverConnected ? t('titlebar.connected') : t('titlebar.offline') }}</span>
      </div>

      <button
        class="h-6 px-1.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer transition-colors font-medium shrink-0 disabled:opacity-40 disabled:cursor-default"
        :disabled="localeSwitching"
        @click.stop="handleToggleLocale"
      >
        {{ locale === 'zh-CN' ? 'EN' : '中' }}
      </button>
    </div>
  </header>
</template>
