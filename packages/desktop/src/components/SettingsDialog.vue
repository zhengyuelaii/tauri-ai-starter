<script setup lang="ts">
import { ref } from 'vue';
import { Settings, Server, Box } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import SettingsGeneralTab from './SettingsGeneralTab.vue';
import SettingsProvidersTab from './SettingsProvidersTab.vue';
import SettingsModelsTab from './SettingsModelsTab.vue';

defineProps<{
  platforms: PlatformMeta[];
  refreshPlatforms: () => Promise<void>;
}>();

const open = ref(false);

function onOpenChange(value: boolean) {
  open.value = value;
  if (!value) {
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  }
}

const tabs = [
  { id: 'general', label: '通用', icon: Settings },
  { id: 'providers', label: '提供商', icon: Server },
  { id: 'models', label: '模型', icon: Box },
];
</script>

<template>
  <Dialog v-model:open="open" @update:open="onOpenChange">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogContent class="!max-w-xl h-[520px] flex flex-col p-0 gap-0">
      <DialogHeader class="px-6 pt-6 pb-3 shrink-0">
        <DialogTitle>设置</DialogTitle>
      </DialogHeader>

      <Tabs
        default-value="general"
        orientation="vertical"
        class="flex flex-1 min-h-0"
      >
        <div class="flex w-full min-h-0">
          <!-- Left nav -->
          <div class="w-[150px] shrink-0 border-r flex flex-col py-2 pl-2 pr-3 mb-4">
            <TabsList
              class="flex-col w-full justify-start rounded-none bg-transparent p-0 gap-0.5"
            >
              <TabsTrigger
                v-for="t in tabs"
                :key="t.id"
                :value="t.id"
                class="w-full justify-start gap-2.5 px-3 py-2 text-sm rounded-md data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground hover:text-foreground"
              >
                <component :is="t.icon" :size="16" />
                <span>{{ t.label }}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <!-- Right content -->
          <div class="flex-1 overflow-y-auto p-6 settings-scrollbar">
            <TabsContent value="general" class="mt-0">
              <SettingsGeneralTab />
            </TabsContent>
            <TabsContent value="providers" class="mt-0">
              <SettingsProvidersTab :platforms="platforms" :refresh-platforms="refreshPlatforms" />
            </TabsContent>
            <TabsContent value="models" class="mt-0">
              <SettingsModelsTab :platforms="platforms" :refresh-platforms="refreshPlatforms" />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
