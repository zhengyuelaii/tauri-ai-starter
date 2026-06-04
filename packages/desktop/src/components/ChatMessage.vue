<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { isToolUIPart, getToolName } from 'ai';
import type { UIMessage } from 'ai';
import { Comark } from '@comark/vue';
import highlight from '@comark/vue/plugins/highlight';
import footnotes from '@comark/vue/plugins/footnotes';
import math, { Math } from '@comark/vue/plugins/math';
import githubLight from '@shikijs/themes/github-light-default';
import java from '@shikijs/langs/java';
import CodeBlock from './CodeBlock.vue';
import 'katex/dist/katex.min.css';

const plugins = [
  footnotes(),
  math(),
  highlight({
    themes: { light: githubLight, dark: githubLight },
    languages: [java],
    preStyles: false,
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
  if (isThinking.value) return true;
  if (userToggled.value) return true;
  return false;
});

const isThinking = computed(() => {
  if (!props.isLast) return false;
  if (props.status !== 'streaming' && props.status !== 'submitted') return false;
  const hasText = props.message.parts.some(
    (p: any) => p.type === 'text' && p.text.trim(),
  );
  return !hasText;
});

const userToggled = ref(false);
const expanded = ref(false);

function isLong(text: string): boolean {
  return text.split('\n').length > 5 || text.length > 500;
}

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
      class="leading-relaxed"
      :class="
        message.role === 'user'
          ? 'max-w-[85%] bg-blue-700 text-white rounded-2xl rounded-br-lg px-4 py-2.5 whitespace-pre-wrap wrap-break-word'
          : 'max-w-full min-w-0 text-foreground'
      "
    >
      <!-- Loading animation -->
      <div v-if="isEmpty" class="flex items-center py-1">
        <div class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0s" />
          <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0.2s" />
          <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0.4s" />
        </div>
      </div>

      <template v-for="(part, i) in message.parts" :key="i">
        <!-- Reasoning -->
        <div v-if="part.type === 'reasoning'" class="w-full mb-2.5">
          <details
            :open="reasoningOpen"
            class="rounded-lg overflow-hidden group"
            @toggle="userToggled = true"
          >
            <summary
              class="cursor-pointer text-sm text-muted-foreground py-1 flex items-center gap-1.5 select-none"
            >
              <template v-if="isThinking">
                <span class="flex items-center gap-0.5">
                  <span class="w-0.75 h-0.75 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0s" />
                  <span class="w-0.75 h-0.75 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0.2s" />
                  <span class="w-0.75 h-0.75 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0.4s" />
                  <span>思考中...</span>
                </span>
              </template>
              <template v-else>
                <span>已思考</span>
              </template>

              <!-- Expand chevron -->
              <span class="shrink-0 transition-transform duration-200 group-open:rotate-90 text-muted-foreground/60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </span>
            </summary>
            <div
              ref="reasoningRef"
              class="border-t border-border"
            >
              <div class="py-2 text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap max-h-37.5 overflow-y-auto">
                {{ part.text }}
              </div>
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
            :components="{ pre: CodeBlock, math: Math }"
            caret
            class="prose-p:mb-2.5 prose-li:mb-1 prose-a:text-[#58a6ff] prose-strong:font-semibold"
          />
        </Suspense>

        <!-- Text (user) -->
        <div v-else-if="part.type === 'text'">
          <div :class="[isLong(part.text) && !expanded ? 'line-clamp-5' : '', 'whitespace-pre-wrap']">
            {{ part.text }}
          </div>
          <button
            v-if="isLong(part.text)"
            tabindex="-1"
            class="text-xs text-blue-400 hover:text-blue-300 mt-1 cursor-pointer"
            @click="expanded = !expanded"
          >
            {{ expanded ? '收起' : '展开全部' }}
          </button>
        </div>

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
            class="border border-border rounded-lg px-3 py-2"
          >
            <summary
              class="cursor-pointer text-sm flex items-center gap-1.5 text-muted-foreground border-b border-border pb-2"
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
              <span class="shrink-0 text-xs text-muted-foreground bg-white/10 rounded px-1.5 py-0.5">输入</span>
              <div class="flex-1 text-xs text-muted-foreground max-h-50 overflow-y-auto whitespace-pre-wrap bg-white/10 rounded px-2 py-1">{{ JSON.stringify((part as any).input, null, 2) }}</div>
            </div>
            <hr
              v-if="(part as any).input && (part as any).output"
              class="mt-2 mb-0 border-border"
            />
            <div
              v-if="(part as any).output"
              class="flex gap-2.5 mt-2 items-start"
            >
              <span class="shrink-0 text-xs text-muted-foreground bg-white/10 rounded px-1.5 py-0.5">输出</span>
              <div class="flex-1 text-xs text-muted-foreground max-h-50 overflow-y-auto whitespace-pre-wrap bg-white/10 rounded px-2 py-1">{{ JSON.stringify((part as any).output, null, 2) }}</div>
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

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Shiki line breaks — required for code highlighting */
.chat-messages .shiki span.line {
  display: block;
}

/* Comark markdown styles — GitHub-like */
.chat-messages .comark-content {
  line-height: 1.7;
  word-break: break-word;
}

/* Headings — use regular CSS for Comark-rendered elements */
.chat-messages .comark-content h1,
.chat-messages .comark-content h2,
.chat-messages .comark-content h3,
.chat-messages .comark-content h4 {
  font-weight: 600;
  line-height: 1.3;
  margin: 24px 0 16px;
}

.chat-messages .comark-content h1 {
  font-size: 1.75em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #d0d7de;
}

.chat-messages .comark-content h2 {
  font-size: 1.4em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #d0d7de;
}

.chat-messages .comark-content h3 {
  font-size: 1.15em;
}

.chat-messages .comark-content h4 {
  font-size: 1em;
  margin: 20px 0 10px;
}

/* Paragraphs */
.chat-messages .comark-content p {
  margin: 0 0 16px;
}

/* Links */
.chat-messages .comark-content a {
  color: #58a6ff;
  text-decoration: none;
}

.chat-messages .comark-content a:hover {
  text-decoration: underline;
}

/* Bold */
.chat-messages .comark-content strong {
  font-weight: 600;
}

/* Lists */
.chat-messages .comark-content ul {
  margin: 0 0 16px;
  padding-left: 2em;
  list-style-type: disc;
}

.chat-messages .comark-content ol {
  margin: 0 0 16px;
  padding-left: 2em;
  list-style-type: decimal;
}

.chat-messages .comark-content li {
  margin-bottom: 0.25em;
}

.chat-messages .comark-content li > ul,
.chat-messages .comark-content li > ol {
  margin-top: 0.25em;
}

/* Blockquote */
.chat-messages .comark-content blockquote {
  margin: 0 0 16px;
  padding: 0 1em;
  border-left: 0.25em solid #d0d7de;
  color: #8b949e;
}

/* Horizontal rule */
.chat-messages .comark-content hr {
  height: 1px;
  padding: 0;
  margin: 24px 0;
  background: rgba(255, 255, 255, 0.12);
  border: 0;
}

/* Tables */
.chat-messages table {
  width: 100%;
  margin: 0 0 16px;
  border-collapse: collapse;
  font-size: 0.92em;
}

.chat-messages th,
.chat-messages td {
  padding: 8px 13px;
  border: 1px solid #d0d7de;
  text-align: left;
}

.chat-messages th {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
}

.chat-messages tr:nth-child(even) td {
  background: rgba(255, 255, 255, 0.03);
}

/* Images */
.chat-messages .comark-content img {
  max-width: 100%;
  border-radius: 6px;
}

/* Footnotes */
.chat-messages .footnote-ref {
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

.chat-messages .footnote-ref a {
  color: #58a6ff;
  text-decoration: none;
}

.chat-messages .footnote-ref a:hover {
  text-decoration: underline;
}

.chat-messages .footnotes {
  margin-top: 2rem;
  font-size: 0.9em;
  color: #8b949e;
}

.chat-messages .footnotes hr {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 1rem;
}

.chat-messages .footnotes h2 {
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.chat-messages .footnotes-list {
  padding-left: 1.5em;
}

.chat-messages .footnotes-list li {
  margin-bottom: 0.4em;
}

.chat-messages .footnote-backref {
  color: #58a6ff;
  text-decoration: none;
  margin-left: 0.25em;
}

/* Inline code */
.chat-messages .comark-content :not(pre) > code {
  background: rgba(175, 184, 193, 0.3);
  color: #cf222e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.chat-messages .comark-content pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
}
</style>
