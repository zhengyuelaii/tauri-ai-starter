<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TitleBar from '@/components/layout/TitleBar.vue';
import type { PlatformMeta } from '@/types';

const { t } = useI18n();

const connected = ref(true);

const dummyPlatforms: PlatformMeta[] = [
  {
    key: 'test',
    name: 'Test Provider',
    connected: true,
    models: [{ id: 'm1', name: 'Test Model', modelId: 'test/m1', supportsThinking: false, enabled: true }],
  },
];

function dummySelectModel() {}
function dummyToggleSidebar() {}
</script>

<template>
  <div class="flex flex-col h-screen bg-background">
    <TitleBar
      :platforms="dummyPlatforms"
      selected-model="test:m1"
      :server-connected="connected"
      @select-model="dummySelectModel"
      @toggle-sidebar="dummyToggleSidebar"
    />

    <div class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-3">
        <h1 class="text-xl font-semibold text-foreground">TitleBar Debug</h1>
        <p class="text-sm text-muted-foreground/60">
          {{ t('debug.dragHint') }}<br />
          {{ t('debug.maximizeHint') }}
        </p>
        <button
          class="h-6 px-2 rounded text-[11px] bg-accent/40 hover:bg-accent/60 cursor-pointer"
          @click="connected = !connected"
        >
          {{ connected ? t('titlebar.offline') : t('titlebar.connected') }}
        </button>
      </div>
    </div>
  </div>
</template>
