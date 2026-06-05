<script setup lang="ts">
import { ref } from 'vue';
import { Copy, Check } from 'lucide-vue-next';

const props = defineProps<{
  __node?: any;
}>();

const copied = ref(false);
const wrapperRef = ref<HTMLElement>();

function detectLang(): string {
  const node = props.__node;
  if (!node) return 'code';
  const codeNode = (node as any[])?.[2];
  if (!codeNode) return 'code';
  const codeProps = (codeNode as any[])?.[1] || {};
  const cls = codeProps.class || codeProps.className || '';
  const m = cls.match(/language-(\w+)/);
  return m ? m[1] : 'code';
}

async function copy() {
  const el = wrapperRef.value?.querySelector('pre');
  if (!el) return;
  await navigator.clipboard.writeText(el.textContent ?? '');
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}
</script>

<template>
  <div ref="wrapperRef" class="code-block-wrapper">
    <div class="code-block-header">
      <span>{{ detectLang() }}</span>
      <button @click="copy">
        <Check v-if="copied" :size="14" />
        <Copy v-else :size="14" />
      </button>
    </div>
    <div class="code-block-body">
      <pre><slot /></pre>
    </div>
  </div>
</template>

<style>
.code-block-wrapper {
  margin: 14px 0;
  border-radius: 10px;
  border: 1px solid var(--border);
  max-width: 100%;
  overflow: hidden;
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--accent);
  border-bottom: 1px solid var(--border);
  font-size: 0.78em;
  font-weight: 500;
  color: var(--muted-foreground);
  user-select: none;
}

.code-block-header button {
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.code-block-header button:hover {
  background: var(--border);
  color: var(--foreground);
}

.code-block-body {
  overflow-x: auto;
  padding: 16px 20px;
  background: var(--accent);
}

.code-block-body pre {
  margin: 0;
  padding: 0 !important;
  border: none !important;
  font-size: 0.88em;
  line-height: 1.65;
  background: transparent !important;
  white-space: pre !important;
}
</style>
