<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import type { PlatformMeta } from './types';
import { fetchPlatforms } from './api';
import { useChatSession } from './composables/useChatSession';
import { useToast } from './composables/useToast';
import Sidebar from './components/Sidebar.vue';
import AppHeader from './components/AppHeader.vue';
import ChatMessage from './components/ChatMessage.vue';
import ChatInput from './components/ChatInput.vue';
import ToastProvider from './components/ToastProvider.vue';

const { toast } = useToast();
const {
  sessions,
  activeSessionId,
  chat,
  isBusy,
  loadSessions,
  switchSession,
  resetToWelcome,
  removeSession,
  renameSession,
  sendMessage,
} = useChatSession();

const input = ref('');
const messagesContainer = ref<HTMLElement>();
const enableThinking = ref(false);
const selectedModel = ref('');
const platforms = ref<PlatformMeta[]>([]);
const serverConnected = ref(false);
const sidebarCollapsed = ref(false);

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

async function refreshPlatforms() {
  try {
    const list = await fetchPlatforms();
    platforms.value = list;
    if (list.length > 0 && !selectedModel.value) {
      const saved = localStorage.getItem('lastModel');
      if (saved && list.some((p) => {
        const [pk, mk] = saved.split(':');
        return p.key === pk && p.models.some((m) => m.id === mk);
      })) {
        selectedModel.value = saved;
      } else {
        const p = list[0];
        if (p && p.models.length > 0) {
          selectedModel.value = `${p.key}:${p.models[0]!.id}`;
        }
      }
    }
  } catch {
    // silent
  }
}

function saveModelPref() {
  if (selectedModel.value) {
    localStorage.setItem('lastModel', selectedModel.value);
  }
}

watch(activeSessionId, (id) => {
  if (!id) {
    const saved = localStorage.getItem('lastModel');
    if (saved) selectedModel.value = saved;
    return;
  }
  const s = sessions.value.find((s) => s.id === id);
  if (s?.providerKey && s?.modelId) {
    selectedModel.value = `${s.providerKey}:${s.modelId}`;
    enableThinking.value = s.enableThinking ?? false;
  }
});

onMounted(async () => {
  const baseUrl = import.meta.env.DEV
    ? ''
    : `http://localhost:${__SERVER_PORT__}`;

  const healthController = new AbortController();
  const healthTimeout = setTimeout(() => healthController.abort(), 5000);

  const results = await Promise.allSettled([
    fetch(`${baseUrl}/health`, { signal: healthController.signal }),
    refreshPlatforms(),
    loadSessions(),
  ]);

  clearTimeout(healthTimeout);

  if (results[0].status === 'fulfilled' && results[0].value.ok) {
    serverConnected.value = true;
  }
});

const showLoading = computed(() => {
  if (!isBusy.value) return false;
  const messages = chat.value.messages;
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

watch(() => chat.value.messages.length, scrollToBottom);
watch(
  () => chat.value.messages[chat.value.messages.length - 1]?.parts?.length,
  scrollToBottom,
);

function onSend() {
  if (!input.value.trim() || !selectedModel.value) return;
  const [provider, modelKey] = selectedModel.value.split(':');

  saveModelPref();
  sendMessage(input.value, {
    provider,
    model: modelKey,
    enableThinking: enableThinking.value,
  });
  input.value = '';
}

function handleNewSession() {
  resetToWelcome();
}

async function handleDeleteSession(id: string) {
  try {
    await removeSession(id);
    toast('会话已删除', 'success');
  } catch {
    toast('删除失败', 'error');
  }
}

async function handleRenameSession(id: string, title: string) {
  await renameSession(id, title);
}

function handleSelectSession(id: string) {
  switchSession(id);
}
</script>

<template>
  <div class="flex h-screen bg-background">
    <ToastProvider />

    <Sidebar
      :collapsed="sidebarCollapsed"
      :sessions="sessions"
      :active-id="activeSessionId"
      :platforms="platforms"
      :refresh-platforms="refreshPlatforms"
      @select="handleSelectSession"
      @delete="handleDeleteSession"
      @rename="handleRenameSession"
      @new="handleNewSession"
    />

    <div class="flex-1 flex flex-col min-w-0 relative">
      <AppHeader
        :platforms="platforms"
        :selected-model="selectedModel"
        :server-connected="serverConnected"
        :status="chat.status"
        :error="chat.error ?? undefined"
        @select-model="selectedModel = $event"
        @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
      />

      <main
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-6 pt-16 pb-32 scroll-smooth chat-messages"
      >
        <div
          v-if="!activeSessionId || chat.messages.length === 0"
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

      <ChatInput
        v-model="input"
        :status="chat.status"
        :enable-thinking="enableThinking"
        :thinking-supported="thinkingSupported"
        @send="onSend"
        @stop="chat.stop()"
        @update:enable-thinking="enableThinking = $event"
      />
    </div>
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
