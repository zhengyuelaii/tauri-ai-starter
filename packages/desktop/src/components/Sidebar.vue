<script setup lang="ts">
import { ref } from 'vue';
import { SquarePen, Trash2, Sparkles, Settings, MoreHorizontal, Pencil } from 'lucide-vue-next';
import SettingsDialog from './SettingsDialog.vue';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlatformMeta } from '@/types';
import type { SessionData } from '@/api';

defineProps<{
  collapsed: boolean;
  sessions: SessionData[];
  activeId: string;
  platforms: PlatformMeta[];
  refreshPlatforms: () => Promise<void>;
}>();

const emit = defineEmits<{
  select: [id: string];
  delete: [id: string];
  rename: [id: string, title: string];
  new: [];
}>();

const hoveredId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editTitle = ref('');
const kebabOpen = ref<Record<string, boolean>>({});

function startEdit(id: string, title: string) {
  editingId.value = id;
  editTitle.value = title;
  kebabOpen.value[id] = false;
}

function confirmEdit(id: string) {
  const trimmed = editTitle.value.trim();
  if (trimmed && trimmed !== '') {
    emit('rename', id, trimmed);
  }
  editingId.value = null;
}

function cancelEdit() {
  editingId.value = null;
}
</script>

<template>
  <aside
    class="shrink-0 border-r bg-card transition-[width] duration-200 ease-out overflow-hidden"
    :class="collapsed ? 'w-0 border-r-0' : 'w-65'"
  >
    <div class="w-65 flex flex-col h-full">
    <!-- Logo -->
    <div class="flex items-center gap-2.5 px-4 py-2 select-none">
      <div class="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shrink-0">
        <Sparkles :size="15" class="text-white" />
      </div>
      <span class="font-semibold text-sm text-foreground tracking-tight">AI Chat</span>
    </div>

    <div class="px-3 pt-2 pb-2">
      <Button
        variant="outline"
        class="w-full justify-start gap-2.5 text-sm font-normal rounded-2xl border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-xl hover:shadow-black/10 transition-shadow h-9"
        @click="emit('new')"
      >
        <SquarePen :size="16" />
        <span>新建对话</span>
      </Button>
    </div>

    <ScrollArea class="flex-1">
      <div class="px-3 flex flex-col gap-0.5">
        <div class="text-xs text-muted-foreground/60 px-3 py-2 font-medium">
          历史会话
        </div>
        <div
          v-for="s in sessions"
          :key="s.id"
          class="group relative flex items-center rounded-xl px-3 h-9 text-sm cursor-pointer transition-colors"
          :class="
            s.id === activeId
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          "
          @mouseenter="hoveredId = s.id"
          @mouseleave="hoveredId = null"
          @click="emit('select', s.id)"
          @dblclick="startEdit(s.id, s.title)"
        >
          <!-- Inline edit mode -->
          <input
            v-if="editingId === s.id"
            v-model="editTitle"
            class="flex-1 bg-background border rounded-lg px-2 py-0.5 text-sm outline-none"
            @keydown.enter="confirmEdit(s.id)"
            @keydown.escape="cancelEdit()"
            @blur="confirmEdit(s.id)"
            @click.stop
            ref="editInput"
          />
          <span v-else class="truncate flex-1">{{ s.title }}</span>

          <!-- Kebab menu -->
          <Popover v-model:open="kebabOpen[s.id]" v-show="hoveredId === s.id && editingId !== s.id" @click.stop>
            <PopoverTrigger as-child>
              <button
                class="h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-accent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal :size="15" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" class="w-36 p-1.5">
              <button
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent cursor-pointer"
                @click="startEdit(s.id, s.title)"
              >
                <Pencil :size="14" />
                <span>重命名</span>
              </button>
              <button
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent hover:text-red-500 cursor-pointer"
                @click="emit('delete', s.id); kebabOpen[s.id] = false"
              >
                <Trash2 :size="14" />
                <span>删除</span>
              </button>
            </PopoverContent>
          </Popover>
        </div>
        <div
          v-if="sessions.length === 0"
          class="px-3 py-8 text-center text-sm text-muted-foreground"
        >
          暂无对话
        </div>
      </div>
    </ScrollArea>

    <div class="px-3 py-2">
      <SettingsDialog :platforms="platforms" :refresh-platforms="refreshPlatforms">
        <template #trigger>
          <Button
            variant="ghost"
            class="w-full justify-start gap-2.5 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl"
          >
            <Settings :size="16" />
            <span>设置</span>
          </Button>
        </template>
      </SettingsDialog>
    </div>
    </div>
  </aside>
</template>
