<script setup lang="ts">
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import ChatStatus from './components/ChatStatus.vue';
import ChatMessage from './components/ChatMessage.vue';
import ChatInput from './components/ChatInput.vue';

interface ModelDef {
  id: string;
  name: string;
  modelId: string;
  supportsThinking: boolean;
}
interface PlatformMeta {
  key: string;
  name: string;
  models: ModelDef[];
}

const chatApiUrl = import.meta.env.DEV
  ? '/api/chat'
  : `http://localhost:${__SERVER_PORT__}/api/chat`;

const input = ref('');
const chat = new Chat({
  transport: new DefaultChatTransport({ api: chatApiUrl }),
});
const messagesContainer = ref<HTMLElement>();
const enableThinking = ref(false);
const selectedModel = ref('');
const platforms = ref<PlatformMeta[]>([]);
const serverConnected = ref(false);

const currentPlatform = computed(() => {
  const [key] = selectedModel.value.split(':');
  return platforms.value.find((p) => p.key === key);
});
const currentModel = computed(() => {
  const [, id] = selectedModel.value.split(':');
  return currentPlatform.value?.models.find((m) => m.id === id);
});
const thinkingSupported = computed(
  () => currentModel.value?.supportsThinking ?? false,
);
const providerLabel = computed(() => currentPlatform.value?.name ?? '');

onMounted(async () => {
  const baseUrl = import.meta.env.DEV
    ? ''
    : `http://localhost:${__SERVER_PORT__}`;

  const healthController = new AbortController();
  const healthTimeout = setTimeout(() => healthController.abort(), 5000);

  // Health check + platforms in parallel
  const results = await Promise.allSettled([
    fetch(`${baseUrl}/health`, { signal: healthController.signal }),
    fetch(`${baseUrl}/api/platforms`),
  ]);

  clearTimeout(healthTimeout);

  if (results[0].status === 'fulfilled' && results[0].value.ok) {
    serverConnected.value = true;
  }

  if (results[1].status === 'fulfilled') {
    try {
      const res = await results[1].value.json();
      platforms.value = (res as { platforms: PlatformMeta[] }).platforms;
      if (platforms.value.length > 0) {
        const p = platforms.value[0];
        if (p && p.models.length > 0) {
          selectedModel.value = `${p.key}:${p.models[0]!.id}`;
        }
      }
    } catch {
      console.error('Failed to parse platforms response');
    }
  }
});

const isBusy = computed(
  () => chat.status === 'submitted' || chat.status === 'streaming',
);

const showLoading = computed(() => {
  if (!isBusy.value) return false;
  const messages = chat.messages;
  if (messages.length === 0) return true;
  const last = messages[messages.length - 1]!;
  if (last.role !== 'assistant') return true;
  if (last.parts.some((p: any) => p.type === 'reasoning')) return false;
  const hasText = last.parts.some((p: any) => p.type === 'text' && p.text);
  return !hasText;
});

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop =
        messagesContainer.value.scrollHeight;
    }
  });
};

watch(() => chat.messages.length, scrollToBottom);
watch(
  () => chat.messages[chat.messages.length - 1]?.parts?.length,
  scrollToBottom,
);

const handleSend = () => {
  if (!input.value.trim()) return;
  const [provider, modelKey] = selectedModel.value.split(':');
  chat.sendMessage(
    { text: input.value },
    { body: { enableThinking: enableThinking.value, provider, model: modelKey } },
  );
  input.value = '';
  scrollToBottom();
};
</script>

<template>
  <div class="flex flex-col h-screen max-w-[800px] mx-auto">
    <!-- Header: status + model selector -->
    <header
      class="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
    >
      <div class="flex items-center">
        <ChatStatus
          :status="serverConnected ? chat.status : 'error'"
          :error="serverConnected ? chat.error : new Error('Server disconnected')"
        />
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedModel"
          class="bg-secondary text-foreground border rounded-md px-2 py-1 text-sm font-sans cursor-pointer outline-none focus:border-gray-500"
        >
          <optgroup
            v-for="p in platforms"
            :key="p.key"
            :label="p.name"
          >
            <option
              v-for="m in p.models"
              :key="m.id"
              :value="`${p.key}:${m.id}`"
            >
              {{ m.name }}
            </option>
          </optgroup>
        </select>
        <label
          v-if="thinkingSupported"
          class="flex items-center gap-1.5 cursor-pointer select-none"
        >
          <input type="checkbox" v-model="enableThinking" class="hidden" />
          <span
            class="w-8 h-[18px] rounded-full relative transition-colors"
            :class="enableThinking ? 'bg-blue-700' : 'bg-gray-600'"
          >
            <span
              class="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform"
              :class="enableThinking ? 'left-[14px]' : 'left-0.5'"
            />
          </span>
          <span class="text-sm text-muted-foreground">思考</span>
        </label>
      </div>
    </header>

    <!-- Messages area -->
    <main
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-6 py-4 scroll-smooth chat-messages"
    >
      <div
        v-if="!chat.messages.length"
        class="flex flex-col items-center justify-center h-full text-muted-foreground gap-4"
      >
        <div class="opacity-40">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-medium text-foreground">
          有什么我可以帮助你的？
        </h2>
        <p class="text-sm">
          {{ currentModel?.name ?? '' }}
          <template v-if="currentModel?.name && providerLabel"> · </template>
          {{ providerLabel }}
        </p>
      </div>

      <ChatMessage
        v-for="(m, idx) in chat.messages"
        :key="m.id"
        :message="m"
        :status="chat.status"
        :is-last="idx === chat.messages.length - 1"
      />

      <!-- Typing indicator -->
      <div v-if="showLoading" class="flex py-2">
        <div class="flex items-center gap-[3px]">
          <span
            class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[typingBounce_1.4s_infinite]"
          />
          <span
            class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[typingBounce_1.4s_infinite]"
            style="animation-delay: 0.2s"
          />
          <span
            class="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[typingBounce_1.4s_infinite]"
            style="animation-delay: 0.4s"
          />
        </div>
      </div>
    </main>

    <!-- Input area -->
    <ChatInput
      v-model="input"
      :status="chat.status"
      @send="handleSend"
      @stop="chat.stop()"
    />
  </div>
</template>

<style>
@keyframes typingBounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
</style>
