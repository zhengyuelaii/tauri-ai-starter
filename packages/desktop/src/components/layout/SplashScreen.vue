<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';

const { t } = useI18n();

defineProps<{
  status: 'connecting' | 'error';
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen bg-background gap-6">
    <div class="w-14 h-14 rounded-2xl bg-accent/60 flex items-center justify-center">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-foreground/60"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>

    <template v-if="status === 'connecting'">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0s" />
        <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0.2s" />
        <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[dotPulse_1.4s_ease-in-out_infinite]" style="animation-delay: 0.4s" />
      </div>
      <p class="text-sm text-muted-foreground/60">{{ t('splash.connecting') }}</p>
    </template>

    <template v-else>
      <h2 class="text-xl font-semibold text-foreground">{{ t('splash.failed') }}</h2>
      <Button variant="outline" class="mt-2" @click="$emit('retry')">
        {{ t('splash.retry') }}
      </Button>
    </template>
  </div>
</template>
