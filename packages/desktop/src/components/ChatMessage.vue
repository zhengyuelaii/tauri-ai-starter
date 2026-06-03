<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { isToolUIPart, getToolName } from 'ai';
import type { UIMessage } from 'ai';
import { Comark } from '@comark/vue';
import highlight from '@comark/vue/plugins/highlight';
import githubDark from '@shikijs/themes/github-dark-default';
import java from '@shikijs/langs/java';

const plugins = [
  highlight({
    themes: { light: githubDark, dark: githubDark },
    languages: [java],
    preStyles: true,
  }),
];

const props = defineProps<{
  message: UIMessage;
  status?: string;
  isLast?: boolean;
}>();

const toolStateLabel: Record<string, string> = {
  'input-streaming': '正在输入参数...',
  'input-available': '参数就绪',
  'output-available': '已执行',
  'output-error': '执行出错',
  'approval-requested': '等待确认',
};

const isEmpty = computed(() => {
  if (!props.isLast) return false;
  if (props.status !== 'streaming' && props.status !== 'submitted') return false;
  const parts = props.message.parts;
  if (parts.length === 0) return true;
  if (parts.some((p: any) => p.type === 'reasoning')) return false;
  return !parts.some((p: any) => p.type === 'text' && p.text);
});

const reasoningOpen = computed(() => {
  if (!props.isLast) return true;
  if (props.status === 'ready' || props.status === 'error') return false;
  const hasText = props.message.parts.some(
    (p: any) => p.type === 'text' && p.text.trim(),
  );
  return !hasText;
});

const reasoningRef = ref<HTMLElement>();

watch(
  () =>
    (props.message.parts.find((p: any) => p.type === 'reasoning') as any)?.text,
  () => {
    nextTick(() => {
      if (reasoningRef.value) {
        reasoningRef.value.scrollTop = reasoningRef.value.scrollHeight;
      }
    });
  },
);

const isToolPhase = computed(() => {
  if (props.status !== 'streaming') return false;
  if (!props.isLast) return false;
  const parts = props.message.parts;
  if (parts.length === 0) return false;
  const last: any = parts[parts.length - 1];
  if (!last) return false;
  const isTool = isToolUIPart(last) || last.type?.startsWith('tool-');
  const isOutput = isTool && last.state === 'output-available';
  const isInput = isTool && last.state === 'input-available';
  return isOutput || isInput;
});
</script>

<template>
  <div
    class="flex flex-col mb-6 animate-[messageIn_.25s_ease]"
    :class="message.role === 'user' ? 'items-end' : 'items-stretch'"
  >
    <div
      v-if="message.role === 'assistant'"
      class="text-xs text-muted-foreground mb-1"
    >
      AI
    </div>

    <div
      class="leading-relaxed"
      :class="
        message.role === 'user'
          ? 'max-w-[85%] bg-blue-700 text-white rounded-2xl rounded-br-lg px-4 py-2.5 whitespace-pre-wrap wrap-break-word'
          : 'max-w-full text-foreground'
      "
    >
      <!-- Loading animation -->
      <div v-if="isEmpty" class="flex items-center py-1">
        <div class="flex items-end gap-0.5 h-3.5">
          <span class="w-0.75 rounded-sm bg-linear-to-b from-blue-400 to-indigo-400 animate-[barGrow_1.2s_infinite] h-1.5" />
          <span class="w-0.75 rounded-sm bg-linear-to-b from-blue-400 to-indigo-400 animate-[barGrow_1.2s_infinite] h-3" style="animation-delay: 0.15s" />
          <span class="w-0.75 rounded-sm bg-linear-to-b from-blue-400 to-indigo-400 animate-[barGrow_1.2s_infinite] h-2" style="animation-delay: 0.3s" />
        </div>
      </div>

      <template v-for="(part, i) in message.parts" :key="i">
        <!-- Reasoning -->
        <div v-if="part.type === 'reasoning'" class="w-full mb-2.5">
          <details
            :open="reasoningOpen"
            class="border border-white/10 rounded-lg overflow-hidden"
          >
            <summary
              class="cursor-pointer text-sm text-muted-foreground px-3 py-2 flex items-center gap-1.5 bg-black/15 hover:bg-black/25 transition-colors select-none"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="opacity-60 shrink-0"
              ><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              思考过程
            </summary>
            <div
              ref="reasoningRef"
              class="px-3 py-2.5 text-sm text-purple-400 leading-relaxed whitespace-pre-wrap max-h-37.5 overflow-y-auto border-t border-white/5"
            >
              {{ part.text }}
            </div>
          </details>
        </div>

        <!-- Text (assistant) with Comark markdown -->
        <Suspense
          v-else-if="part.type === 'text' && message.role === 'assistant'"
        >
          <Comark
            :markdown="part.text.replace(/^\n+/, '')"
            :plugins="plugins"
            :streaming="isLast && status === 'streaming'"
            caret
            class="prose-p:mb-2.5 prose-li:mb-1 prose-a:text-[#58a6ff] prose-strong:font-semibold"
          />
        </Suspense>

        <!-- Text (user) -->
        <div v-else-if="part.type === 'text'">{{ part.text }}</div>

        <!-- Tool call -->
        <div
          v-else-if="isToolUIPart(part) || (part as any).type?.startsWith('tool-')"
          class="my-2"
        >
          <details
            :open="
              (part as any).state === 'input-streaming' ||
              (part as any).state === 'output-available'
            "
            class="bg-black/20 rounded-lg px-3 py-2"
          >
            <summary
              class="cursor-pointer text-sm flex items-center gap-1.5 text-muted-foreground"
            >
              <span class="bg-amber-900 text-amber-300 text-xs px-1.5 py-px rounded font-medium">工具</span>
              {{ getToolName(part as any) || (part as any).type?.replace('tool-', '') }}
              <span class="text-muted-foreground text-xs ml-1">
                {{ toolStateLabel[(part as any).state] || (part as any).state }}
              </span>
              <span
                v-if="(part as any).state === 'input-streaming'"
                class="w-2.5 h-2.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin ml-auto"
              />
            </summary>
            <div
              v-if="(part as any).input"
              class="flex gap-2.5 mt-2 items-start"
            >
              <span class="shrink-0 text-xs text-muted-foreground bg-white/5 rounded px-1.5 py-0.5">输入</span>
              <pre class="flex-1 m-0 text-xs text-muted-foreground overflow-x-auto max-h-50 overflow-y-auto whitespace-pre-wrap break-all">{{ JSON.stringify((part as any).input, null, 2) }}</pre>
            </div>
            <hr
              v-if="(part as any).input && (part as any).output"
              class="mt-2 mb-0 border-white/5"
            />
            <div
              v-if="(part as any).output"
              class="flex gap-2.5 mt-2 items-start"
            >
              <span class="shrink-0 text-xs text-muted-foreground bg-white/5 rounded px-1.5 py-0.5">输出</span>
              <pre class="flex-1 m-0 text-xs text-muted-foreground overflow-x-auto max-h-50 overflow-y-auto whitespace-pre-wrap break-all">{{ JSON.stringify((part as any).output, null, 2) }}</pre>
            </div>
            <div
              v-if="(part as any).state === 'output-error'"
              class="text-red-500 text-sm mt-2"
            >
              {{ (part as any).errorText }}
            </div>
          </details>
        </div>
      </template>

      <!-- Tool phase waiting -->
      <div
        v-if="isToolPhase"
        class="flex items-center gap-2.5 mt-2.5 pt-2.5 text-sm text-muted-foreground border-t border-white/5"
      >
        <div class="flex items-end gap-0.5 h-3.5">
          <span class="w-0.75 rounded-sm bg-linear-to-b from-blue-400 to-indigo-400 animate-[barGrow_1.2s_infinite] h-1.5" />
          <span class="w-0.75 rounded-sm bg-linear-to-b from-blue-400 to-indigo-400 animate-[barGrow_1.2s_infinite] h-3" style="animation-delay: 0.15s" />
          <span class="w-0.75 rounded-sm bg-linear-to-b from-blue-400 to-indigo-400 animate-[barGrow_1.2s_infinite] h-2" style="animation-delay: 0.3s" />
        </div>
        <span>正在生成回复...</span>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes barGrow {
  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: scaleY(0.5);
  }
  30% {
    opacity: 1;
    transform: scaleY(1);
  }
}

/* Comark markdown styles */
.chat-messages :deep(.comark-content) {
  line-height: 1.7;
  word-break: break-word;
}

.chat-messages :deep(.comark-content h1),
.chat-messages :deep(.comark-content h2),
.chat-messages :deep(.comark-content h3),
.chat-messages :deep(.comark-content h4) {
  margin: 18px 0 8px;
  font-weight: 600;
  line-height: 1.35;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-messages :deep(.comark-content h1) {
  font-size: 1.5em;
}
.chat-messages :deep(.comark-content h2) {
  font-size: 1.3em;
}
.chat-messages :deep(.comark-content h3) {
  font-size: 1.1em;
}
.chat-messages :deep(.comark-content h4) {
  font-size: 1em;
}

.chat-messages :deep(.comark-content p) {
  margin: 0 0 10px;
}

.chat-messages :deep(.comark-content a) {
  color: #58a6ff;
}

.chat-messages :deep(.comark-content strong) {
  font-weight: 600;
}

.chat-messages :deep(.comark-content ul),
.chat-messages :deep(.comark-content ol) {
  margin: 0 0 10px;
  padding-left: 1.8em;
}

.chat-messages :deep(.comark-content li) {
  margin-bottom: 4px;
}

.chat-messages :deep(.comark-content blockquote) {
  margin: 0 0 10px;
  padding: 4px 14px;
  border-left: 3px solid #58a6ff;
  color: #8b949e;
  background: rgba(88, 166, 255, 0.06);
  border-radius: 0 4px 4px 0;
}

.chat-messages :deep(.comark-content pre) {
  margin: 12px 0;
  padding: 14px 18px;
  border-radius: 6px;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.88em;
  line-height: 1.65;
}

.chat-messages :deep(.comark-content pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
}

.chat-messages :deep(.comark-content :not(pre) > code) {
  background: rgba(110, 118, 129, 0.25);
  color: #f2a4a9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.chat-messages :deep(.comark-content hr) {
  margin: 20px 0;
  border: none;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.chat-messages :deep(.comark-content table) {
  width: 100%;
  margin: 10px 0;
  border-collapse: collapse;
  font-size: 0.92em;
}

.chat-messages :deep(.comark-content th),
.chat-messages :deep(.comark-content td) {
  padding: 7px 13px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-align: left;
}

.chat-messages :deep(.comark-content th) {
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
}

.chat-messages :deep(.comark-content tr:nth-child(even) td) {
  background: rgba(255, 255, 255, 0.02);
}

.chat-messages :deep(.comark-content img) {
  max-width: 100%;
  border-radius: 6px;
}
</style>
