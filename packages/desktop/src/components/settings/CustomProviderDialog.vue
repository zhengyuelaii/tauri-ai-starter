<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Trash2 } from 'lucide-vue-next';
import type { ModelDef } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const { t } = useI18n();

export interface CustomProviderData {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: ModelDef[];
}

interface ModelRow {
  value: string;
  supportsThinking: boolean;
}

const props = defineProps<{
  open: boolean;
  saving?: boolean;
  editing?: CustomProviderData & { key: string } | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  save: [data: CustomProviderData];
}>();

const name = ref('');
const baseUrl = ref('');
const apiKey = ref('');
const models = ref<ModelRow[]>([{ value: '', supportsThinking: false }]);

const isEditing = computed(() => !!props.editing);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.editing) {
        name.value = props.editing.name;
        baseUrl.value = props.editing.baseUrl;
        apiKey.value = '';
        models.value = props.editing.models.map((m) => ({
          value: m.name,
          supportsThinking: m.supportsThinking,
        }));
      } else {
        name.value = '';
        baseUrl.value = '';
        apiKey.value = '';
        models.value = [{ value: '', supportsThinking: false }];
      }
    }
  },
);

function addModel() {
  models.value.push({ value: '', supportsThinking: false });
}

function removeModel(index: number) {
  if (models.value.length <= 1) return;
  models.value.splice(index, 1);
}

const canSave = computed(() => {
  return (
    name.value.trim() &&
    baseUrl.value.trim() &&
    (isEditing.value || apiKey.value.trim()) &&
    models.value.length > 0 &&
    models.value.every((m) => m.value.trim())
  );
});

function handleSave() {
  if (!canSave.value) return;
  emit('save', {
    name: name.value.trim(),
    baseUrl: baseUrl.value.trim(),
    apiKey: apiKey.value.trim(),
    models: models.value.map((m) => ({
      id: m.value.trim(),
      name: m.value.trim(),
      modelId: m.value.trim(),
      supportsThinking: m.supportsThinking,
      enabled: true,
    })),
  });
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg! gap-0! p-0!">
      <DialogHeader class="px-5 pt-5 pb-3">
        <DialogTitle>{{ isEditing ? t('providers.edit') : t('providers.customTitle') }}</DialogTitle>
        <p class="text-xs text-muted-foreground mt-1">{{ t('providers.customDesc') }}</p>
      </DialogHeader>

      <div class="px-5 pb-5 space-y-4">
        <!-- Name -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium">{{ t('providers.name') }}</label>
          <Input v-model="name" :placeholder="t('providers.namePlaceholder')" class="h-8 text-sm" />
        </div>

        <!-- Base URL -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium">Base URL</label>
          <Input v-model="baseUrl" :placeholder="t('providers.baseUrlPlaceholder')" class="h-8 text-sm" />
        </div>

        <!-- API Key -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium">API Key</label>
          <Input
            v-model="apiKey"
            type="password"
            :placeholder="isEditing ? '•••••••• (留空则不修改)' : t('providers.apiKeyPlaceholder')"
            class="h-8 text-sm"
          />
        </div>

        <!-- Models -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium">{{ t('providers.models') }}</label>
            <Button variant="ghost" size="sm" class="h-6 text-xs" @click="addModel">
              <Plus :size="12" class="mr-1" />
              {{ t('providers.addModel') }}
            </Button>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="(model, i) in models"
              :key="i"
              class="flex items-center gap-2 bg-secondary rounded-lg px-2.5 py-2"
            >
              <Input v-model="model.value" :placeholder="t('providers.modelName')" class="h-7 text-sm flex-1" />
              <label class="flex items-center gap-1 text-xs text-muted-foreground shrink-0 cursor-pointer">
                <input type="checkbox" v-model="model.supportsThinking" class="size-3" />
                {{ t('chat.thinking') }}
              </label>
              <button
                class="text-muted-foreground hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                @click="removeModel(i)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" @click="emit('update:open', false)">
            {{ t('confirm.cancel') }}
          </Button>
          <Button size="sm" :disabled="!canSave || saving" @click="handleSave">
            {{ saving ? t('providers.connecting') : t('providers.save') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
