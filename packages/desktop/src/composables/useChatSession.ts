import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
import { ref, shallowRef, watch, computed } from 'vue';
import { fetchSessions, createSession, deleteSession, updateSession, fetchMessages, addMessage } from '@/api';
import type { SessionData } from '@/api';
import type { UIMessage } from 'ai';

const chatApiUrl = import.meta.env.DEV
  ? '/api/chat'
  : `http://localhost:${__SERVER_PORT__}/api/chat`;

const transport = new DefaultChatTransport({ api: chatApiUrl });

export function useChatSession() {
  const sessions = ref<SessionData[]>([]);
  const activeSessionId = ref<string>('');
  const chat = shallowRef(new Chat({ transport }));
  const savedMessageIds = new Set<string>();

  const currentSession = computed(() =>
    sessions.value.find((s) => s.id === activeSessionId.value) ?? null,
  );

  const isBusy = computed(
    () => chat.value.status === 'submitted' || chat.value.status === 'streaming',
  );

  async function loadSessions() {
    try {
      sessions.value = await fetchSessions();
    } catch {
      // silent
    }
  }

  async function switchSession(id: string) {
    if (id === activeSessionId.value) return;
    activeSessionId.value = id;

    try {
      const msgs = await fetchMessages(id);
      const uiMessages = msgs.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        parts: m.parts as UIMessage['parts'],
      })) as UIMessage[];
      chat.value = new Chat({ transport, messages: uiMessages });
      savedMessageIds.clear();
      for (const m of uiMessages) {
        savedMessageIds.add(m.id);
      }
    } catch {
      chat.value = new Chat({ transport });
      savedMessageIds.clear();
    }
  }

  async function newSession() {
    try {
      const s = await createSession();
      sessions.value.unshift(s as unknown as SessionData);
      activeSessionId.value = s.id;
      chat.value = new Chat({ transport });
      savedMessageIds.clear();
    } catch {
      // silent
    }
  }

  async function removeSession(id: string) {
    await deleteSession(id);
    sessions.value = sessions.value.filter((s) => s.id !== id);
    if (activeSessionId.value === id) {
      chat.value = new Chat({ transport });
      savedMessageIds.clear();
      activeSessionId.value = '';
    }
  }

  async function renameSession(id: string, title: string) {
    await updateSession(id, { title });
    const s = sessions.value.find((s) => s.id === id);
    if (s) s.title = title;
  }

  async function saveNewMessages() {
    const sid = activeSessionId.value;
    if (!sid) return;
    const msgs = chat.value.messages;
    const newMsgs = msgs.filter((m) => m.role !== 'system' && !savedMessageIds.has(m.id));
    for (const m of newMsgs) {
      try {
        await addMessage(sid, {
          id: m.id,
          role: m.role,
          parts: m.parts ?? [],
          createdAt: new Date().toISOString(),
        });
        savedMessageIds.add(m.id);
      } catch {
        // silent
      }
    }
  }

  watch(
    () => chat.value.status,
    (status, oldStatus) => {
      if (status === 'ready' && oldStatus === 'streaming') {
        saveNewMessages();
      }
    },
  );

  function sendMessage(
    text: string,
    opts: { provider: string; model: string; enableThinking: boolean },
  ) {
    const sessionId = activeSessionId.value;

    if (!sessionId) {
      createSession({
        providerKey: opts.provider,
        modelId: opts.model,
        enableThinking: opts.enableThinking,
      }).then((s) => {
        sessions.value.unshift(s as unknown as SessionData);
        activeSessionId.value = s.id;
        chat.value.sendMessage(
          { text },
          {
            body: {
              provider: opts.provider,
              model: opts.model,
              enableThinking: opts.enableThinking,
              sessionId: s.id,
            },
          },
        );
      });
      return;
    }

    chat.value.sendMessage(
      { text },
      {
        body: {
          provider: opts.provider,
          model: opts.model,
          enableThinking: opts.enableThinking,
          sessionId,
        },
      },
    );
  }

  async function updateSessionMeta(updates: {
    providerKey?: string;
    modelId?: string;
    enableThinking?: boolean;
  }) {
    const sid = activeSessionId.value;
    if (!sid) return;
    await updateSession(sid, updates);
    const s = sessions.value.find((s) => s.id === sid);
    if (s) {
      if (updates.providerKey !== undefined) s.providerKey = updates.providerKey;
      if (updates.modelId !== undefined) s.modelId = updates.modelId;
      if (updates.enableThinking !== undefined) s.enableThinking = updates.enableThinking;
    }
  }

  return {
    sessions,
    activeSessionId,
    chat,
    currentSession,
    isBusy,
    loadSessions,
    switchSession,
    newSession,
    removeSession,
    renameSession,
    updateSessionMeta,
    sendMessage,
    saveNewMessages,
  };
}
