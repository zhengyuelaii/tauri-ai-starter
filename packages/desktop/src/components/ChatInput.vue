<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { Send, Square } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  status: string;
  disabled?: boolean;
  enableThinking: boolean;
  thinkingSupported: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:enableThinking': [value: boolean];
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
        <Square :size="14" fill="currentColor" />
      </button>
      <button
        v-else
        class="w-9 h-9 rounded-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer shrink-0 ml-2 transition-colors disabled:opacity-35"
        :disabled="!localInput.trim()"
        title="发送"
        @click="emit('send')"
      >
        <Send :size="16" />
      </button>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
      <label
        v-if="thinkingSupported"
        class="flex items-center gap-1.5 cursor-pointer select-none"
      >
        <input
          type="checkbox"
          :checked="enableThinking"
          class="hidden"
          @change="emit('update:enableThinking', ($event.target as HTMLInputElement).checked)"
        />
        <span
          class="w-8 h-[18px] rounded-full relative transition-colors"
          :class="enableThinking ? 'bg-blue-700' : 'bg-gray-600'"
        >
          <span
            class="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform"
            :class="enableThinking ? 'left-[14px]' : 'left-0.5'"
          />
        </span>
        <span>思考</span>
      </label>
      <div v-else />
      <span>Shift + Enter 换行</span>
    </div>
  </div>
</template>
