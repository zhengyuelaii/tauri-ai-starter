# 技术栈选型

Tauri + NestJS 桌面 AI Agent 项目，2026-06 确定。

## 整体架构

**pnpm workspace monorepo**，三个包：`desktop`、`server`、`shared`。选择 pnpm 而非 npm/yarn 的理由：原生 workspace symlink 支持、更快的安装速度、严格的依赖隔离。

**shared 包采用零构建 TS 源引用**：`main`/`types`/`exports` 直接指向 `src/index.ts`，消费端的工具链（ts-node、Vite）实时转译。省去构建步骤和 dist 产物，迭代更快。

**Considered:** 将 shared 编译为 CJS dist（标准做法），但每次修改 shared 需要重新 build，开发体验差。pnpm symlink + ts-node 原生 TS 处理能力使零构建成为可能。

## 桌面 + 服务端分工

**Tauri v2 + Vue 3 + Vite** 作为桌面壳和 UI 层，**NestJS** 作为 Agent 推理引擎。分离理由：Agent 循环涉及 LLM API 调用和长时间运行的推理任务，独立进程更稳定，可重启 server 而不影响 UI。

**Server 采用 CJS 模式 + ts-node** 而非 `nest build` 编译运行。理由：ts-node 可直接 import shared 的 TS 源码，无需中间编译步骤。生产构建仍使用 tsc。

## 数据层

**SQLite + Drizzle ORM**：SQLite 是桌面应用的天然选择——零配置、嵌入式、不需要外部服务。Drizzle 而非 TypeORM（NestJS 默认推荐）的理由：TypeORM 需要额外的 build 步骤和装饰器编译，Drizzle 是纯 TS 无代码生成，与 zero-build 哲学一致。

**Considered:** JSON 文件起步（极简，后期切 SQLite），TypeORM（NestJS 官方推荐，生态成熟）。JSON 跨表查询和迁移会成为死胡同；TypeORM 的 schema 同步在 SQLite 上不够稳定。

## Agent 编排

**DeepSeek + Vercel AI SDK**：DeepSeek 提供 OpenAI 兼容 API，Vercel AI SDK 提供统一的 streaming 接口和 Agent 循环基元（tool calling），避免 LangChain 的重抽象成本。模型可替换（切换 provider 只改 API key 和 endpoint）。

## 前端

**Tailwind CSS + shadcn-vue**：Tailwind 是实用优先的选择，shadcn 提供可复制的组件源码而非 npm 依赖，匹配项目的低抽象、可定制偏好。

## 通信

**REST + SSE**：常规 CRUD 走 REST，Agent 流式输出走 SSE（Server-Sent Events）。NestJS 的 `@Sse()` 装饰器原生支持。WebSocket 对于"用户发指令→Agent 流式返回"的单向流模式属于过度设计。
