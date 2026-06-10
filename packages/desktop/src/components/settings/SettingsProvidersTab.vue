<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Eye, EyeOff, Plus, Plug2, Unplug, ChevronRight } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/composables/useToast';
import {
  fetchSettingsProviders,
  connectProvider,
  disconnectProvider,
  createCustomProvider,
  updateCustomProvider,
  type ProviderItem,
  type CustomProviderPayload,
} from '@/api/settings';
import CustomProviderDialog, { type CustomProviderData } from './CustomProviderDialog.vue';

const { t } = useI18n();

const props = defineProps<{
  platforms: PlatformMeta[];
  refreshPlatforms: () => Promise<void>;
}>();

const providers = ref<ProviderItem[]>([]);
const showKey = ref<Record<string, boolean>>({});
const apiKeyInput = ref<Record<string, string>>({});
const connecting = ref<Record<string, boolean>>({});
const customDialogOpen = ref(false);
const editingProvider = ref<(CustomProviderData & { key: string }) | null>(null);
const savingCustom = ref(false);

async function loadProviders() {
  try {
    const res = await fetchSettingsProviders();
    providers.value = res.providers;
  } catch (e: any) {
    toast(t('providers.loadFailed') + ': ' + (e?.message || t('providers.unknownError')), 'error');
  }
}

const toggleShowKey = (key: string) => {
  showKey.value[key] = !showKey.value[key];
};

const connect = async (key: string) => {
  if (!apiKeyInput.value[key]?.trim()) return;
  connecting.value[key] = true;
  try {
    await connectProvider(key, apiKeyInput.value[key]);
    apiKeyInput.value[key] = '';
    await Promise.all([loadProviders(), props.refreshPlatforms()]);
  } catch (e: any) {
    toast(t('providers.connectFailed') + ': ' + (e?.message || t('providers.unknownError')), 'error');
  } finally {
    connecting.value[key] = false;
  }
};

const disconnect = async (key: string) => {
  try {
    await disconnectProvider(key);
    await Promise.all([loadProviders(), props.refreshPlatforms()]);
  } catch (e: any) {
    toast(t('providers.disconnectFailed') + ': ' + (e?.message || t('providers.unknownError')), 'error');
  }
};

const connectedList = computed(() =>
  providers.value.filter((p) => p.connected),
);

const unconnectedBuiltinList = computed(() =>
  providers.value.filter((p) => !p.connected && !p.isCustom),
);

function openCreateDialog() {
  editingProvider.value = null;
  customDialogOpen.value = true;
}

function openEditDialog(p: ProviderItem) {
  const models = props.platforms
    .filter((pl) => pl.key === p.key)
    .flatMap((pl) => pl.models);
  editingProvider.value = {
    key: p.key,
    name: p.name,
    baseUrl: p.baseUrl ?? '',
    apiKey: '',
    models,
  };
  customDialogOpen.value = true;
}

async function handleSave(data: CustomProviderData) {
  savingCustom.value = true;
  try {
    if (editingProvider.value) {
      const payload: Partial<CustomProviderPayload> = { name: data.name, baseUrl: data.baseUrl, models: data.models };
      if (data.apiKey) (payload as CustomProviderPayload).apiKey = data.apiKey;
      await updateCustomProvider(editingProvider.value.key, payload);
    } else {
      await createCustomProvider(data as CustomProviderPayload);
    }
    customDialogOpen.value = false;
    await Promise.all([loadProviders(), props.refreshPlatforms()]);
  } catch (e: any) {
    toast(
      (editingProvider.value ? t('providers.updateFailed') : t('providers.createFailed')) +
        ': ' + (e?.message || t('providers.unknownError')),
      'error',
    );
  } finally {
    savingCustom.value = false;
  }
}

onMounted(loadProviders);
</script>

<template>
  <div class="space-y-6">
    <!-- Connected section -->
    <div>
      <div class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
        {{ t('providers.connected') }}
      </div>
      <div v-if="connectedList.length === 0" class="text-sm text-muted-foreground py-3">
        {{ t('providers.noConnected') }}
      </div>
      <div class="divide-y divide-border rounded-lg bg-secondary overflow-hidden">
        <div v-for="p in connectedList" :key="p.key" class="flex items-center justify-between px-3 py-2.5">
          <div class="flex items-center gap-2">
            <Plug2 :size="14" class="text-green-500" />
            <span class="text-sm">{{ p.name }}</span>
            <span v-if="p.isCustom" class="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">CUSTOM</span>
          </div>
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="sm" class="text-muted-foreground hover:text-red-500" @click="disconnect(p.key)">
              <Unplug :size="14" class="mr-1.5" />
              {{ t('providers.disconnect') }}
            </Button>
            <ChevronRight
              v-if="p.isCustom"
              :size="16"
              class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer -ml-0.5"
              @click="openEditDialog(p)"
            />
            <ChevronRight
              v-else
              :size="16"
              class="text-transparent -ml-0.5"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- All providers -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {{ t('providers.all') }}
        </span>
        <Button variant="ghost" size="sm" class="h-6 text-xs" @click="openCreateDialog">
          <Plus :size="12" class="mr-1" />
          {{ t('providers.addCustom') }}
        </Button>
      </div>

      <div v-if="unconnectedBuiltinList.length === 0" class="text-sm text-muted-foreground py-3">
        {{ t('providers.allConnected') }}
      </div>

      <!-- Built-in unconnected -->
      <div class="space-y-2">
        <Collapsible
          v-for="p in unconnectedBuiltinList"
          :key="p.key"
          :default-open="false"
        >
          <CollapsibleTrigger
            class="group flex items-center justify-between w-full rounded-lg px-3 py-2.5 bg-secondary hover:bg-accent transition-colors cursor-pointer text-sm"
          >
            <span>{{ p.name }}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="opacity-50 transition-transform group-data-[state=open]:rotate-180"
            ><path d="m6 9 6 6 6-6" /></svg>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="px-1 pt-3 pb-1">
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <Input
                    :type="showKey[p.key] ? 'text' : 'password'"
                    v-model="apiKeyInput[p.key]"
                    :placeholder="t('providers.apiKeyPlaceholder')"
                    class="h-8 text-sm pr-9"
                  />
                  <button
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    @click="toggleShowKey(p.key)"
                  >
                    <EyeOff v-if="showKey[p.key]" :size="14" />
                    <Eye v-else :size="14" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  class="shrink-0"
                  :disabled="connecting[p.key] || !apiKeyInput[p.key]?.trim()"
                  @click="connect(p.key)"
                >
                  <Plus :size="14" class="mr-1.5" />
                  {{ connecting[p.key] ? t('providers.connecting') : t('providers.connect') }}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>

    <CustomProviderDialog
      :open="customDialogOpen"
      :saving="savingCustom"
      :editing="editingProvider"
      @update:open="customDialogOpen = $event"
      @save="handleSave"
    />
  </div>
</template>
