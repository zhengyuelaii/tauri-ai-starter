<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  status: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  send: [];
  stop: [];
}>();

const textareaRef = ref<HTMLTextAreaElement>();
const isComposing = ref(false);

const localInput = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => {
    localInput.value = v;
  },
);
watch(localInput, (v) => {
  emit('update:modelValue', v);
});

const adjustHeight = () => {
  nextTick(() => {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  });
};

watch(localInput, adjustHeight);

const handleKeydown = (e: KeyboardEvent) => {
  if (isComposing.value) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (props.status === 'streaming') {
      emit('stop');
    } else if (localInput.value.trim()) {
      emit('send');
    }
  }
};

const isStreaming = computed(
  () => props.status === 'streaming' || props.status === 'submitted',
);
</script>

<template>
  <div class="px-6 pb-6 shrink-0">
    <div
      class="flex items-end bg-secondary rounded-2xl border px-4 py-1 transition-colors focus-within:border-gray-500"
    >
      <textarea
        ref="textareaRef"
        v-model="localInput"
        placeholder="发送消息..."
        :disabled="disabled || isStreaming"
        rows="1"
        class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground resize-none py-2 leading-relaxed max-h-40 disabled:opacity-60"
        @keydown="handleKeydown"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
      />
      <button
        v-if="isStreaming"
        class="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0 ml-2 transition-colors"
        title="停止生成"
        @click="emit('stop')"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
        ><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
      </button>
      <button
        v-else
        class="w-9 h-9 rounded-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer shrink-0 ml-2 transition-colors disabled:opacity-35"
        :disabled="!localInput.trim()"
        title="发送"
        @click="emit('send')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
      </button>
    </div>
    <div class="text-center mt-1.5 text-xs text-muted-foreground">
      <span>Shift + Enter 换行</span>
    </div>
  </div>
</template>
