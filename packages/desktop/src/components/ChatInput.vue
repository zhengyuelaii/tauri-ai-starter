<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { Send, Square, Paperclip, Brain } from 'lucide-vue-next';

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
  <div class="absolute bottom-0 left-0 right-0 pt-6 pb-4 bg-linear-to-t from-background from-60% to-transparent">
    <div class="max-w-5xl mx-auto px-6">
    <div class="bg-secondary rounded-2xl border border-transparent hover:shadow-[0_0_15px_3px_rgba(255,255,255,0.12)] focus-within:shadow-[0_0_20px_5px_rgba(255,255,255,0.18)] transition-shadow">
      <!-- Top: textarea -->
      <textarea
        ref="textareaRef"
        v-model="localInput"
        placeholder="发送消息..."
        :disabled="disabled || isStreaming"
        rows="1"
        class="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground resize-none px-4 pt-3 pb-2 leading-relaxed max-h-40 disabled:opacity-60"
        @keydown="handleKeydown"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
      />

      <!-- Bottom row: tools -->
      <div class="flex items-center justify-between px-3 pb-2.5">
        <div class="flex items-center gap-1">
          <!-- Thinking toggle -->
          <button
            v-if="thinkingSupported"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer"
            :class="enableThinking ? 'text-blue-400 bg-blue-400/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'"
            @click="emit('update:enableThinking', !enableThinking)"
          >
            <Brain :size="14" />
            <span>思考</span>
          </button>

          <!-- Attach file (placeholder) -->
          <button
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <Paperclip :size="14" />
            <span>附件</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <span class="text-xs text-muted-foreground/50">Enter 发送，Shift+Enter 换行</span>

          <button
            v-if="isStreaming"
            class="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
            title="停止生成"
            @click="emit('stop')"
          >
            <Square :size="13" fill="currentColor" />
          </button>
          <button
            v-else
            class="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors disabled:opacity-35"
            :disabled="!localInput.trim()"
            title="发送"
            @click="emit('send')"
          >
            <Send :size="14" />
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
