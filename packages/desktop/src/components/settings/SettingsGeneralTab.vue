<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLocale } from '@/composables/useLocale';
import { mode, setTheme } from '@/composables/useTheme';
import type { ThemeMode } from '@/composables/useTheme';
import Select from '@/components/shared/Select.vue';

const { t, locale } = useI18n();
const version = '0.1.0';

const languageOptions = computed(() => [
  { value: 'zh-CN', label: t('settings.chinese') },
  { value: 'en', label: t('settings.english') },
]);

const colorSchemeOptions = computed(() => [
  { value: 'light', label: t('settings.light') },
  { value: 'dark', label: t('settings.dark') },
  { value: 'system', label: t('settings.system') },
]);

function onLanguageChange(value: string) {
  setLocale(value as 'zh-CN' | 'en');
}

function onThemeChange(value: string) {
  setTheme(value as ThemeMode);
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <span class="text-sm">{{ t('settings.language') }}</span>
      <Select :model-value="locale" :options="languageOptions" @update:model-value="onLanguageChange" />
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm">{{ t('settings.colorScheme') }}</span>
      <Select :model-value="mode" :options="colorSchemeOptions" @update:model-value="onThemeChange" />
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm">{{ t('settings.version') }}</span>
      <span class="text-sm text-muted-foreground">v{{ version }}</span>
    </div>
  </div>
</template>
