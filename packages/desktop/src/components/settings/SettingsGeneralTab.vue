<script setup lang="ts">
import { ref } from 'vue';

const language = ref('zh');
const colorScheme = ref('dark');
const version = '0.1.0';

const languageOptions = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];

const colorSchemeOptions = [
  { value: 'dark', label: '深色' },
  { value: 'light', label: '浅色' },
  { value: 'system', label: '跟随系统' },
];

</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <span class="text-sm">语言</span>
      <select v-model="language" class="settings-select">
        <option v-for="o in languageOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm">配色方案</span>
      <select v-model="colorScheme" class="settings-select">
        <option v-for="o in colorSchemeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm">版本</span>
      <span class="text-sm text-muted-foreground">v{{ version }}</span>
    </div>
  </div>
</template>

<style scoped>
.settings-select {
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--secondary);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding: 6px 32px 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--foreground);
  cursor: pointer;
  outline: none;
  width: 160px;
  transition: border-color 0.15s;
}
.settings-select:focus {
  border-color: var(--ring);
}
</style>
