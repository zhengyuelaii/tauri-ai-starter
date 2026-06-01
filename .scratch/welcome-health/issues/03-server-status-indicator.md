# 服务器状态指示器

Status: ready-for-agent

## Parent

[Welcome Page + Health Check PRD](../PRD.md)

## What to build

在欢迎页上添加服务器状态检测功能。页面加载时自动请求 `/health`，展示三种状态：检查中（loading）、已连接（connected）、未连接（disconnected）。

具体内容：
1. **状态卡片组件**：三个状态各有不同的视觉表现——loading 显示灰色加载提示，connected 显示绿色"已连接" + 服务器时间戳和版本号，disconnected 显示红色"未连接" + 错误提示
2. **健康检查调用**：`onMounted` 时 `fetch('/health')`，根据响应切换状态
3. **Vite 代理配置**：在 vite.config.ts 中配置 proxy，将 `/health` 代理到 `http://localhost:3000`，解决 WebView 跨域问题
4. **组件测试**：安装 vitest + @vue/test-utils + jsdom，编写测试覆盖 loading / connected / disconnected 三种状态。Mock 全局 `fetch`，不发起真实网络请求

## Acceptance criteria

- [ ] 页面加载时显示 loading 状态（灰色，提示"正在检查服务器连接..."）
- [ ] server 启动时，状态卡片变为绿色"已连接"，显示时间戳和版本号
- [ ] server 未启动时，状态卡片变为红色"未连接"，显示错误提示
- [ ] Vite proxy 正确转发 `/health` 到 `localhost:3000`
- [ ] 组件测试覆盖三种状态，`pnpm -F @tauri-monorepo/desktop test` 通过
- [ ] `vue-tsc --noEmit` 类型检查通过

## Blocked by

- #01 — 需要 `/health` 端点返回数据
- #02 — 需要 Tailwind + shadcn 基础样式和欢迎页骨架
