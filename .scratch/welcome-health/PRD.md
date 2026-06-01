# Welcome Page + Health Check

Status: ready-for-agent

## Problem Statement

用户打开桌面应用后看到的是脚手架生成的页面（Vite/Tauri/Vue logo 和 greet 表单），内容与产品无关，视觉粗糙。同时无法确认 server 是否在运行，用户没有直观的方式判断应用处于可用状态。

## Solution

用 Tailwind CSS + shadcn-vue 重写欢迎页，替换脚手架内容。Server 暴露一个健康检查接口。欢迎页在加载时自动检测 server 状态，并通过状态指示器展示给用户。

## User Stories

1. As a user, I want to see a beautiful welcome page when I open the app, so that the app feels polished and professional
2. As a user, I want to see whether the server is connected, so that I know the app is ready to use
3. As a user, I want to see a loading state while the server status is being checked, so that I'm not left wondering if the app is frozen
4. As a user, I want to see a green "connected" indicator when the server is reachable, so that I can proceed with confidence
5. As a user, I want to see a red "disconnected" indicator when the server is unreachable, so that I can diagnose connectivity issues before attempting to use the app
6. As a user, I want to see the server's response details (timestamp, version) when connected, so that I can verify it's the expected server
7. As a developer, I want a `GET /health` API endpoint, so that I can programmatically monitor server health from any client

## Implementation Decisions

### Tailwind CSS + shadcn-vue 安装

Desktop 包当前没有 Tailwind。需要安装 `tailwindcss`（v4）和 `@tailwind/vite`，在 vite.config.ts 中注册插件。然后运行 `npx shadcn-vue@latest init` 初始化 shadcn，这将自动配置 CSS 变量、基础样式和 `components.json`。shadcn-vue 底层依赖 Radix Vue 和 Tailwind，init 过程会处理这些依赖。

### 欢迎页布局

App.vue 替换为居中单列布局：顶部是应用名称和副标题，中间是服务器状态卡片。状态卡片有三个状态：loading（灰色，检查中）、connected（绿色，显示时间戳和版本）、disconnected（红色，显示错误提示）。不使用 Tauri invoke 或 Rust 命令。

### 健康检查接口

在 AppController 中新增 `GET /health`。返回 JSON：

```json
{
  "status": "ok",
  "timestamp": "2026-06-01T12:00:00.000Z",
  "version": "0.0.1"
}
```

版本号从 server 的 package.json 读取。时间戳在每次请求时生成。

### 前端调用

WelcomePage 组件在 `onMounted` 时用 `fetch('/health')` 请求 server 状态。维护三个状态的 ref：loading、connected、disconnected。根据响应切换展示。

### Vite 代理

Vite dev server 默认端口 1420，server 端口 3000。直连 `http://localhost:3000/health` 会有跨域问题（Tauri WebView 中 origin 特殊）。配置 Vite proxy 将 `/health` 代理到 `http://localhost:3000`，开发和生产环境统一使用相对路径。

### 脚手架清理

移除 App.vue 中的 greet 逻辑、logo 图片、外部链接和关联 CSS。保留 `main.ts` 的 createApp 挂载逻辑。

## Testing Decisions

### 健康检查测试

遵循已有测试风格（`app.controller.spec.ts` 使用 `Test.createTestingModule`），新增两个测试用例：

- `GET /health` 返回 `{ status: "ok" }` 结构
- `GET /health` 返回的 timestamp 是合法的 ISO 字符串

使用 supertest 做 HTTP 层测试，而非直接测试 controller 方法。测试外部行为而非实现细节。

### 前端测试

Desktop 包当前无测试框架。安装 vitest + @vue/test-utils + jsdom。测试欢迎页组件的三个状态：

- loading 状态渲染 loading 文字
- 成功响应后渲染"已连接"和服务器信息
- 请求失败后渲染"未连接"和错误提示

Mock 全局 `fetch`，不发起真实网络请求。

## Out of Scope

- 健康检查的认证/授权
- 数据库连接检查（SQLite 尚未集成）
- WebSocket / SSE 连接检查
- 定时轮询健康状态（仅页面加载时检查一次）
- Tauri Rust 端的进程健康检查
- 欢迎页之外的其他页面或路由
- 生产环境 server 地址配置（当前仅开发环境代理）
