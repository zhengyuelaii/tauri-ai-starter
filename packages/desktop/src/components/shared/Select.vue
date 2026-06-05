<script setup lang="ts">
import { ref, computed } from 'vue';
import { Check, ChevronDown } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
}

const props = defineProps<{
  modelValue: string;
  options: Option[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const open = ref(false);

const selectedLabel = computed(() =>
  props.options.find((o) => o.value === props.modelValue)?.label ?? props.placeholder ?? '',
);

function select(value: string) {
  emit('update:modelValue', value);
  open.value = false;
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        class="justify-between gap-2 text-sm font-normal h-8 w-40"
      >
        <span class="truncate">{{ selectedLabel }}</span>
        <ChevronDown
          :size="14"
          class="opacity-50 transition-transform shrink-0"
          :class="{ 'rotate-180': open }"
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-40 p-1 gap-0">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm hover:bg-accent cursor-pointer transition-colors"
        @click="select(opt.value)"
      >
        <Check v-if="modelValue === opt.value" :size="14" class="shrink-0 opacity-70" />
        <span v-else class="w-[14px] shrink-0" />
        <span>{{ opt.label }}</span>
      </button>
    </PopoverContent>
  </Popover>
</template>
