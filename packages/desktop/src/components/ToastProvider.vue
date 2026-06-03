<script setup lang="ts">
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

const { toasts } = useToast();

const iconMap: Record<string, any> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colorMap: Record<string, string> = {
  success: 'border-green-600',
  error: 'border-red-500',
  info: 'border-blue-500',
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-center gap-2.5 bg-background border rounded-lg px-4 py-3 shadow-lg min-w-[260px] max-w-[380px] animate-[toastSlideIn_0.25s_ease-out]"
        :class="colorMap[t.type]"
      >
        <component
          :is="iconMap[t.type]"
          :size="16"
          :class="t.type === 'success' ? 'text-green-500' : t.type === 'error' ? 'text-red-500' : 'text-blue-500'"
          class="shrink-0"
        />
        <span class="text-sm flex-1">{{ t.message }}</span>
        <button
          class="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
          @click="toasts = toasts.filter(x => x.id !== t.id)"
        >
          <X :size="14" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style>
@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
