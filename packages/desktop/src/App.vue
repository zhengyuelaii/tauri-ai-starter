<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

type Status = "loading" | "connected" | "disconnected";

const status = ref<Status>("loading");
const serverVersion = ref("");
const serverTimestamp = ref("");
const errorMessage = ref("");
let controller: AbortController | null = null;

onMounted(() => {
  controller = new AbortController();
  const timeoutId = setTimeout(() => controller!.abort(), 5000);

  const healthUrl = import.meta.env.DEV
    ? "/health"
    : "http://localhost:3000/health";

  fetch(healthUrl, { signal: controller.signal })
    .then(async (res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      status.value = "connected";
      serverVersion.value = data.version;
      serverTimestamp.value = data.timestamp;
    })
    .catch((e: unknown) => {
      if (e instanceof DOMException && e.name === "AbortError") {
        status.value = "disconnected";
        errorMessage.value = "连接超时";
        return;
      }
      status.value = "disconnected";
      errorMessage.value = e instanceof Error ? e.message : "未知错误";
    });
});

onBeforeUnmount(() => {
  controller?.abort();
});
</script>

<template>
  <div class="flex h-screen items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-8 text-center">
      <div>
        <h1 class="text-4xl font-semibold tracking-tight text-foreground">
          Agent Studio
        </h1>
        <p class="mt-2 max-w-md text-lg text-muted-foreground">
          一个桌面 AI Agent 开发平台——设定目标，Agent 自主规划并执行任务。
        </p>
      </div>

      <div class="w-80 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <div v-if="status === 'loading'" class="text-muted-foreground">
          正在检查服务器连接...
        </div>
        <div v-else-if="status === 'connected'" class="text-green-600">
          <p class="font-medium">已连接</p>
          <p class="mt-2 text-sm">版本: {{ serverVersion }}</p>
          <p class="text-sm">时间: {{ serverTimestamp }}</p>
        </div>
        <div v-else class="text-red-500">
          <p class="font-medium">未连接</p>
          <p class="mt-2 text-sm">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
