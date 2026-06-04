import { ref, watch, nextTick, onUnmounted, type Ref } from 'vue';

export function useScrollToBottom(chat: Ref<{ status: string; messages: unknown[] }>) {
  const messagesContainer = ref<HTMLElement>();

  function scrollToBottom() {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });
  }

  let scrollTimer: ReturnType<typeof setInterval> | null = null;

  watch(
    () => chat.value.status,
    (status) => {
      if (status === 'streaming') {
        if (!scrollTimer) {
          scrollTimer = setInterval(scrollToBottom, 100);
        }
      } else {
        if (scrollTimer) {
          clearInterval(scrollTimer);
          scrollTimer = null;
        }
        scrollToBottom();
      }
    },
  );

  watch(() => (chat.value.messages as unknown[]).length, scrollToBottom);

  onUnmounted(() => {
    if (scrollTimer) clearInterval(scrollTimer);
  });

  return { messagesContainer, scrollToBottom };
}
