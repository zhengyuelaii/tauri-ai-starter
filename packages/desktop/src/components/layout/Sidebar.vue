<script setup lang="ts">
import { ref } from 'vue';
import { SquarePen, Trash2, Settings, MoreHorizontal, Pencil } from 'lucide-vue-next';
import SettingsDialog from '../settings/SettingsDialog.vue';
import ConfirmDialog from '../shared/ConfirmDialog.vue';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlatformMeta } from '@/types';
import type { SessionData } from '@/types';

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
const deleteTarget = ref<string | null>(null);

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

function handleDelete(id: string) {
  deleteTarget.value = id;
}

function confirmDelete() {
  if (deleteTarget.value) {
    kebabOpen.value[deleteTarget.value] = false;
    emit('delete', deleteTarget.value);
  }
  deleteTarget.value = null;
}

function cancelDelete() {
  deleteTarget.value = null;
}
</script>

<template>
  <aside
    class="shrink-0 border-r border-border/40 bg-card transition-[width] duration-300 ease-out overflow-hidden"
    :class="collapsed ? 'w-0 border-r-0' : 'w-65'"
  >
    <div class="w-65 flex flex-col h-full">
    <div class="px-3 pt-12 pb-2">
      <Button
        variant="outline"
        class="w-full justify-start gap-2.5 text-sm font-medium rounded-xl border-border/50 bg-accent/40 text-foreground/80 hover:text-foreground hover:bg-accent/60 hover:border-border/80 hover:shadow-sm transition-all duration-200 h-9"
        @click="emit('new')"
      >
        <SquarePen :size="16" />
        <span>开始新对话</span>
      </Button>
    </div>

    <ScrollArea class="flex-1">
      <div class="px-3 flex flex-col gap-0.5">
        <div class="text-[11px] tracking-wider text-muted-foreground/50 px-3 pt-1 pb-2 font-medium uppercase">
          最近
        </div>
        <div
          v-for="s in sessions"
          :key="s.id"
          class="group relative flex items-center rounded-lg px-2.5 h-9 text-[13px] cursor-pointer transition-all duration-150"
          :class="
            s.id === activeId
              ? 'bg-accent/80 text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
          "
          @mouseenter="hoveredId = s.id"
          @mouseleave="hoveredId = null"
          @click="emit('select', s.id)"
          @dblclick="startEdit(s.id, s.title)"
        >
          <input
            v-if="editingId === s.id"
            v-model="editTitle"
            class="flex-1 bg-background border border-border rounded-md px-2 py-0.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/20"
            @keydown.enter="confirmEdit(s.id)"
            @keydown.escape="cancelEdit()"
            @blur="confirmEdit(s.id)"
            @click.stop
            ref="editInput"
          />
          <span v-else class="truncate flex-1 leading-tight">{{ s.title }}</span>

          <Popover v-model:open="kebabOpen[s.id]">
            <PopoverTrigger as-child @click.stop>
              <button
                :class="[
                  'h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent cursor-pointer transition-all duration-150',
                  (hoveredId === s.id || kebabOpen[s.id]) && editingId !== s.id ? 'opacity-100' : 'opacity-0'
                ]"
              >
                <MoreHorizontal :size="14" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" class="w-36 p-1.5 rounded-xl shadow-lg border-border/60">
              <button
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-accent cursor-pointer transition-colors duration-150"
                @click="startEdit(s.id, s.title)"
              >
                <Pencil :size="13" />
                <span>重命名</span>
              </button>
              <button
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors duration-150"
                @click="handleDelete(s.id)"
              >
                <Trash2 :size="13" />
                <span>删除</span>
              </button>
            </PopoverContent>
          </Popover>
        </div>
        <div
          v-if="sessions.length === 0"
          class="px-3 py-10 text-center text-[13px] text-muted-foreground/50"
        >
          暂无对话
        </div>
      </div>
    </ScrollArea>

    <div class="px-3 pb-3 pt-1 border-t border-border/30">
      <SettingsDialog :platforms="platforms" :refresh-platforms="refreshPlatforms">
        <template #trigger>
          <Button
            variant="ghost"
            class="w-full justify-start gap-2.5 text-[13px] font-normal text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-150 h-9"
          >
            <Settings :size="15" />
            <span>设置</span>
          </Button>
        </template>
      </SettingsDialog>
    </div>
    </div>
  </aside>

  <ConfirmDialog
    :open="deleteTarget !== null"
    title="删除会话"
    description="确定要删除这个会话吗？此操作不可撤销。"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>
