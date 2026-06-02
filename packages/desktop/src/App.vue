<script setup lang="ts">
import { ref, onMounted } from "vue";

type Status = "loading" | "connected" | "disconnected";

const status = ref<Status>("loading");
const serverVersion = ref("");
const serverTimestamp = ref("");
const errorMessage = ref("");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

onMounted(async () => {
  const healthUrl = import.meta.env.DEV
    ? "/health"
    : `http://localhost:${__SERVER_PORT__}/health`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(healthUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      status.value = "connected";
      serverVersion.value = data.version;
      serverTimestamp.value = data.timestamp;
      return;
    } catch (e: unknown) {
      if (attempt === MAX_RETRIES - 1) {
        status.value = "disconnected";
        if (e instanceof DOMException && e.name === "TimeoutError") {
          errorMessage.value = "连接超时";
        } else if (e instanceof Error) {
          errorMessage.value = e.message;
        } else {
          errorMessage.value = "未知错误";
        }
      } else {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
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
