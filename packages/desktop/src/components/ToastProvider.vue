<script setup lang="ts">
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

const { toasts } = useToast();

const iconMap: Record<string, any> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const borderColor: Record<string, string> = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
};

const iconColor: Record<string, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-24 right-4 z-9999 flex flex-col gap-2 pointer-events-none">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start gap-2.5 bg-white border border-gray-200 border-l-[3px] rounded-lg pl-3 pr-2 py-3 shadow-lg shadow-black/10 min-w-70 max-w-95 animate-[toastSlideIn_0.25s_ease-out]"
        :class="borderColor[t.type]"
      >
        <component
          :is="iconMap[t.type]"
          :size="16"
          :class="iconColor[t.type]"
          class="shrink-0 mt-px"
        />
        <span class="text-sm flex-1 text-gray-700 leading-snug">{{ t.message }}</span>
        <button
          class="shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer mt-px"
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
