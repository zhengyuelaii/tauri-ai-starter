<script setup lang="ts">
import { ref, computed } from 'vue';
import { Eye, EyeOff, Plus, Plug2, Unplug } from 'lucide-vue-next';
import type { PlatformMeta } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const props = defineProps<{
  platforms: PlatformMeta[];
}>();

const connectedProviders = ref(new Set<string>());
const showKey = ref<Record<string, boolean>>({});
const apiKeyInput = ref<Record<string, string>>({});

const toggleShowKey = (key: string) => {
  showKey.value[key] = !showKey.value[key];
};

const connect = (key: string) => {
  if (apiKeyInput.value[key]?.trim()) {
    connectedProviders.value = new Set(connectedProviders.value).add(key);
    apiKeyInput.value[key] = '';
  }
};

const disconnect = (key: string) => {
  const next = new Set(connectedProviders.value);
  next.delete(key);
  connectedProviders.value = next;
};

const connectedList = computed(() =>
  [...connectedProviders.value]
);

const platformNameMap = computed(() => {
  const m = new Map<string, string>();
  for (const p of props.platforms) m.set(p.key, p.name);
  return m;
});

const unconnectedList = computed(() =>
  props.platforms.filter(p => !connectedProviders.value.has(p.key))
);
</script>

<template>
  <div class="space-y-6">
    <!-- Connected section -->
    <div>
      <div class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
        已连接供应商
      </div>
      <div v-if="connectedList.length === 0" class="text-sm text-muted-foreground py-3">
        暂无已连接的供应商
      </div>
      <div class="divide-y divide-border rounded-lg bg-secondary overflow-hidden">
        <div v-for="key in connectedList" :key="key" class="flex items-center justify-between px-3 py-2.5">
        <div class="flex items-center gap-2">
          <Plug2 :size="14" class="text-green-500" />
          <span class="text-sm">{{ platformNameMap.get(key) ?? key }}</span>
        </div>
        <Button variant="ghost" size="sm" class="text-muted-foreground hover:text-red-500" @click="disconnect(key)">
          <Unplug :size="14" class="mr-1.5" />
          断开连接
        </Button>
        </div>
      </div>
    </div>

    <!-- All providers -->
    <div>
      <div class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
        全部供应商
      </div>
      <div v-if="unconnectedList.length === 0" class="text-sm text-muted-foreground py-3">
        所有供应商已连接
      </div>
      <div class="space-y-2">
        <Collapsible
          v-for="p in unconnectedList"
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
                    placeholder="输入 API Key"
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
                  :disabled="connectedProviders.has(p.key) || !apiKeyInput[p.key]?.trim()"
                  @click="connect(p.key)"
                >
                  <Plus :size="14" class="mr-1.5" />
                  {{ connectedProviders.has(p.key) ? '已连接' : '连接' }}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  </div>
</template>
