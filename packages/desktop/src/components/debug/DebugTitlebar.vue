<script setup lang="ts">
import { ref } from 'vue';
import TitleBar from '@/components/layout/TitleBar.vue';
import type { PlatformMeta } from '@/types';

const connected = ref(true);
const status = ref<'ready' | 'streaming'>('ready');

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
      :status="status"
      @select-model="dummySelectModel"
      @toggle-sidebar="dummyToggleSidebar"
    />

    <div class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-3">
        <h1 class="text-xl font-semibold text-foreground">TitleBar Debug</h1>
        <p class="text-sm text-muted-foreground/60">
          拖拽标题栏移动窗口<br />
          双击标题栏最大化/还原
        </p>
        <div class="flex gap-2 justify-center">
          <button
            class="h-6 px-2 rounded text-[11px] bg-accent/40 hover:bg-accent/60 cursor-pointer"
            @click="connected = !connected"
          >
            {{ connected ? '离线' : '在线' }}
          </button>
          <button
            class="h-6 px-2 rounded text-[11px] bg-accent/40 hover:bg-accent/60 cursor-pointer"
            @click="status = status === 'ready' ? 'streaming' : 'ready'"
          >
            {{ status === 'ready' ? '就绪' : '回复中' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
