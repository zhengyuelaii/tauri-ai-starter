<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Trash2, MessageSquare, Sparkles, PanelLeft, Settings } from 'lucide-vue-next';
import SettingsDialog from './SettingsDialog.vue';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { PlatformMeta } from '@/types';

export interface Session {
  id: string;
  title: string;
}

defineProps<{
  collapsed: boolean;
  sessions: Session[];
  activeId: string;
  platforms: PlatformMeta[];
  refreshPlatforms: () => Promise<void>;
}>();

const emit = defineEmits<{
  select: [id: string];
  delete: [id: string];
  new: [];
  toggle: [];
}>();

const hoveredId = ref<string | null>(null);
</script>

<template>
  <aside
    class="shrink-0 border-r bg-card flex flex-col transition-[width] duration-200 ease-out"
    :class="collapsed ? 'w-[56px]' : 'w-[260px]'"
  >
    <!-- Logo -->
    <div class="p-3 pb-1">
      <!-- Expanded logo -->
      <div v-if="!collapsed" class="flex items-center gap-2.5 px-1 py-1.5 select-none">
        <div class="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center shrink-0">
          <Sparkles :size="15" class="text-white" />
        </div>
        <span class="font-semibold text-sm text-foreground tracking-tight flex-1">AI Chat</span>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          title="收起侧边栏"
          @click="emit('toggle')"
        >
          <PanelLeft :size="16" />
        </Button>
      </div>
      <!-- Collapsed logo mark (click to expand) -->
      <div
        v-else
        class="flex justify-center py-1"
      >
        <div
          class="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all"
          title="展开侧边栏"
          @click="emit('toggle')"
        >
          <Sparkles :size="15" class="text-white" />
        </div>
      </div>
    </div>

    <!-- Expanded -->
    <template v-if="!collapsed">
      <div class="px-3 pb-3">
        <Button
          variant="secondary"
          class="w-full justify-start gap-2 text-sm font-medium"
          @click="emit('new')"
        >
          <Plus :size="16" />
          <span>新建对话</span>
        </Button>
      </div>

      <ScrollArea class="flex-1">
        <div class="px-2">
          <div class="text-xs text-muted-foreground px-3 py-2 font-medium">
            历史对话
          </div>
          <div
            v-for="s in sessions"
            :key="s.id"
            class="group relative flex items-center rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors"
            :class="
              s.id === activeId
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            "
            @mouseenter="hoveredId = s.id"
            @mouseleave="hoveredId = null"
            @click="emit('select', s.id)"
          >
            <span class="truncate flex-1">{{ s.title }}</span>
            <Button
              v-show="hoveredId === s.id"
              variant="ghost"
              size="icon"
              class="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-500"
              @click.stop="emit('delete', s.id)"
            >
              <Trash2 :size="14" />
            </Button>
          </div>
          <div
            v-if="sessions.length === 0"
            class="px-3 py-6 text-center text-sm text-muted-foreground"
          >
            暂无对话
          </div>
        </div>
      </ScrollArea>

      <div class="p-3 border-t">
        <SettingsDialog :platforms="platforms" :refresh-platforms="refreshPlatforms">
          <template #trigger>
            <Button
              variant="ghost"
              class="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Settings :size="16" />
              <span>设置</span>
            </Button>
          </template>
        </SettingsDialog>
      </div>
    </template>

    <!-- Collapsed -->
    <TooltipProvider v-else :delay-duration="300">
      <div class="flex flex-col items-center gap-1 pt-3">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10"
              @click="emit('new')"
            >
              <Plus :size="18" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" :side-offset="8">
            新建对话
          </TooltipContent>
        </Tooltip>

        <div class="w-8 h-px bg-border my-2" />

        <Tooltip v-for="s in sessions" :key="s.id">
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10"
              :class="s.id === activeId
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground'"
              @click="emit('select', s.id)"
            >
              <MessageSquare :size="18" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" :side-offset="8" class="max-w-[160px]">
            {{ s.title }}
          </TooltipContent>
        </Tooltip>

        <div class="flex-1" />

        <SettingsDialog :platforms="platforms" :refresh-platforms="refreshPlatforms">
          <template #trigger>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-10 w-10 text-muted-foreground mb-2"
                >
                  <Settings :size="18" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" :side-offset="8">
                设置
              </TooltipContent>
            </Tooltip>
          </template>
        </SettingsDialog>
      </div>
    </TooltipProvider>
  </aside>
</template>
