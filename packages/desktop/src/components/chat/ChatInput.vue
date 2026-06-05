<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowUp, Square, Paperclip, Brain } from 'lucide-vue-next';

const { t } = useI18n();

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
  <div ref="rootRef" data-chat-input class="absolute bottom-0 left-0 right-0 pt-10 pb-4 bg-linear-to-t from-background from-40% to-transparent">
    <div class="max-w-5xl mx-auto px-6">
    <div class="bg-white rounded-2xl border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-within:shadow-[0_4px_24px_rgba(59,130,246,0.12)] focus-within:hover:shadow-[0_4px_24px_rgba(59,130,246,0.12)] transition-shadow duration-300">
      <!-- Top: textarea -->
      <textarea
        ref="textareaRef"
        v-model="localInput"
        :placeholder="t('chat.placeholder')"
        :disabled="disabled || isStreaming"
        rows="1"
        class="w-full bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 resize-none px-4 pt-3 pb-2 leading-relaxed max-h-40 disabled:opacity-60"
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
            :class="enableThinking ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
            @click="emit('update:enableThinking', !enableThinking)"
          >
            <Brain :size="14" />
            <span>{{ t('chat.thinking') }}</span>
          </button>

          <!-- Attach file (placeholder) -->
          <button
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Paperclip :size="14" />
            <span>{{ t('chat.attach') }}</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <span class="text-xs text-gray-400">{{ t('chat.shortcut') }}</span>

          <button
            v-if="isStreaming"
            class="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
            :title="t('chat.stop')"
            @click="emit('stop')"
          >
            <Square :size="13" fill="currentColor" />
          </button>
          <button
            v-else
            class="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:bg-blue-600"
            :disabled="!localInput.trim()"
            :title="t('chat.send')"
            @click="emit('send')"
          >
            <ArrowUp :size="16" />
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
