<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatSession } from './composables/useChatSession';
import { usePlatforms } from './composables/usePlatforms';
import { useScrollToBottom } from './composables/useScrollToBottom';
import { useToast } from './composables/useToast';
import { BASE_URL } from './api/constants';
import { fetchWithTimeout } from './api/utils';
import Sidebar from './components/layout/Sidebar.vue';
import TitleBar from './components/layout/TitleBar.vue';
import ChatMessage from './components/chat/ChatMessage.vue';
import ChatInput from './components/chat/ChatInput.vue';
import ToastProvider from './components/shared/ToastProvider.vue';

const { t } = useI18n();
const { toast } = useToast();
const {
  sessions,
  activeSessionId,
  chat,
  loadSessions,
  switchSession,
  resetToWelcome,
  removeSession,
  renameSession,
  sendMessage,
} = useChatSession();

const {
  platforms,
  selectedModel,
  enableThinking,
  currentModel,
  thinkingSupported,
  providerLabel,
  refreshPlatforms,
  saveModelPref,
} = usePlatforms(activeSessionId, sessions);

const { messagesContainer, scrollToBottom } = useScrollToBottom(chat);

const input = ref('');
const serverConnected = ref(false);
const sidebarCollapsed = ref(false);
const inputHeight = ref(0);

let selectScrollId = 0;
let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  const results = await Promise.allSettled([
    fetchWithTimeout(`${BASE_URL}/health`, { timeout: 5000 }),
    refreshPlatforms(),
    loadSessions(),
  ]);

  if (results[0].status === 'fulfilled' && results[0].value.ok) {
    serverConnected.value = true;
  }

  const inputEl = document.querySelector('[data-chat-input]');
  if (inputEl) {
    resizeObserver = new ResizeObserver(([entry]) => {
      inputHeight.value = entry!.contentRect.height;
    });
    resizeObserver.observe(inputEl);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

watch(() => chat.value.error, (err) => {
  if (err) toast(err.message || t('chat.error'), 'error');
});

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
    toast(t('sidebar.deleteSuccess'), 'success');
  } catch {
    toast(t('sidebar.deleteFailed'), 'error');
  }
}

async function handleRenameSession(id: string, title: string) {
  await renameSession(id, title);
}

async function handleSelectSession(id: string) {
  const token = ++selectScrollId;
  await switchSession(id);
  if (token === selectScrollId) {
    setTimeout(scrollToBottom, 50);
  }
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background relative">
    <ToastProvider />

    <TitleBar
      class="absolute top-0 left-0 right-0 z-10"
      :platforms="platforms"
      :selected-model="selectedModel"
      :server-connected="serverConnected"
      @select-model="selectedModel = $event"
      @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
    />

    <div class="flex flex-1 min-h-0">
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
        <main
          ref="messagesContainer"
          tabindex="-1"
          class="flex-1 overflow-y-auto px-6 scroll-smooth chat-messages"
        >
        <div class="max-w-7xl mx-auto min-w-0 h-full pt-12">
        <div
          v-if="!activeSessionId || chat.messages.length === 0"
          class="flex flex-col items-center justify-center h-full text-muted-foreground gap-4"
        >
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
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-semibold text-foreground tracking-tight">
            {{ t('app.welcome') }}
          </h2>
          <p class="text-sm text-muted-foreground/50">
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

        <div v-if="activeSessionId && chat.messages.length > 0" :style="{ height: (inputHeight + 24) + 'px' }" />
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
  </div>
</template>

<style>
</style>
