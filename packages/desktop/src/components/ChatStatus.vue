<script setup lang="ts">
defineProps<{
  status: string;
  error?: Error;
}>();

defineEmits<{
  retry: [];
}>();

const statusLabel: Record<string, string> = {
  submitted: '已提交',
  streaming: '正在回复...',
  ready: '就绪',
  error: '出错',
};
</script>

<template>
  <div class="flex items-center gap-2 text-sm text-muted-foreground">
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
    <span>{{ statusLabel[status] || status }}</span>
    <template v-if="status === 'error' && error">
      <span class="text-red-500 truncate max-w-[200px]">{{ error.message }}</span>
      <button
        class="border px-2 py-0.5 rounded text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
        @click="$emit('retry')"
      >
        重试
      </button>
    </template>
  </div>
</template>
