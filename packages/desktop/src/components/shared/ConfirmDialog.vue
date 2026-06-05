<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  open: boolean;
  title: string;
  description: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => !v && emit('cancel')">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2 sm:justify-end">
        <Button variant="outline" @click="emit('cancel')">{{ t('confirm.cancel') }}</Button>
        <Button variant="destructive" @click="emit('confirm')">{{ t('confirm.delete') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
