# tauri-ai-starter

[English](README.md) | 中文

快速搭建 AI 桌面应用的开发模板。基于 Tauri v2 + Vue 3 + NestJS，开箱即用的 AI Chat 应用，代码简洁，易于二次开发。

![主界面](docs/images/main-chat.png)

## 亮点

- **原生桌面体验** — 基于 Tauri v2（非 Electron），内存占用低，macOS 自定义标题栏 + 毛玻璃效果
- **开箱即用** — 安装依赖即可启动，内置 AI Chat 完整功能
- **多模型支持** — Strategy 模式接入多平台模型，支持思考/深度推理模式
- **跨平台** — macOS / Windows / Linux 完整构建支持
- **Sidecar 架构** — NestJS 后端编译为独立二进制文件，内置在应用包中
- **代码简洁** — 模块化设计，Composable + DTO + Strategy 模式，易于扩展

## 技术栈

| 层级 | 技术 |
|---|---|
| 桌面框架 | Tauri v2 (Rust) |
| 前端 | Vue 3 + Vite + Tailwind CSS v4 |
| 后端 | NestJS 11（Tauri Sidecar） |
| 数据库 | SQLite (better-sqlite3 + Drizzle ORM) |
| AI | AI SDK (`@ai-sdk/openai-compatible`) |
| 构建 | pnpm monorepo |

## 功能

- 多模型 AI 对话（流式 SSE 响应）
- 对话历史管理（创建、重命名、删除、自动生成标题）
- Markdown 渲染（数学公式、代码高亮）
- 思考/深度推理模式切换
- 明/暗主题切换（跟随系统 / 手动切换，Tauri 原生窗口同步）
- i18n 国际化（中文 / English，语言切换器）
- API Key 加密存储（AES-256-GCM）
- macOS 自定义标题栏 + 毛玻璃效果

## 模型服务商

| 服务商 | 模型 | 状态 |
|---|---|---|
| SiliconFlow | DeepSeek V4、Qwen3.6/3.5、Kimi K2.6、GLM 5.1、MiniMax M2.5 等 | 已支持 |
| DeepSeek | DeepSeek V4 Flash、DeepSeek V4 Pro | 已支持 |
| OpenAI | GPT-4o、o4-mini 等 | 计划中 |
| Anthropic | Claude Opus 4.x、Claude Sonnet 4.x 等 | 计划中 |
| Google | Gemini 2.5 系列 | 计划中 |
| Ollama | 本地部署模型 | 计划中 |

欢迎提 PR 贡献新的模型服务商。

## 快速开始

```bash
# 安装依赖（需要 pnpm >= 11.4）
pnpm install

# 启动桌面应用（开发模式）
pnpm tauri:dev

# 或分模块启动
pnpm dev          # 同时启动前后端
pnpm web:dev      # 仅前端 (http://localhost:1420)
pnpm server:dev   # 仅后端 (http://localhost:3000)
```

生产构建：

```bash
pnpm tauri build
```

> 首次使用需在设置中配置提供商的 API Key（SiliconFlow、DeepSeek 等），否则无法发送消息。

## 安装已构建的版本

从 [Releases](https://github.com/zhengyuelaii/tauri-ai-starter/releases) 页面下载对应平台的安装包。

### macOS

下载 `.dmg` 文件，双击打开后将 app 拖入 Applications。首次打开时，由于尚未进行 Apple 代码签名，系统会提示“已损坏，无法打开”。

**解决方法（任选其一）：**

```bash
# 方法一：终端执行（推荐，一劳永逸）
xattr -cr /Applications/tauri-ai-starter.app

# 方法二：右键点击 app → 打开 → 点“打开”
```

### Windows

下载 `.msi` 安装包运行。首次打开时 SmartScreen 可能会拦截，点击“更多信息” → “仍要运行”即可。


## 项目结构

```
├── packages/
│   ├── desktop/         ← Tauri v2 + Vue 3 桌面应用
│   │   ├── src/         # Vue 组件 / 状态管理 / API 层
│   │   └── src-tauri/   # Rust 层（窗口管理 / Sidecar 启动）
│   ├── server/          ← NestJS 后端（编译为 Sidecar 二进制文件）
│   │   └── src/modules/
│   │       ├── chat/    # AI 聊天 + SSE 流式传输
│   │       ├── sessions/# 会话 CRUD
│   │       └── settings/# 平台 API Key 管理
│   └── shared/          ← 共享 TypeScript 类型
```

### 关键入口

| 功能 | 文件 |
|---|---|
| 窗口创建 / Sidecar 启动 | `packages/desktop/src-tauri/src/lib.rs` |
| 前端入口 | `packages/desktop/src/App.vue` |
| 聊天逻辑（SSE 流式） | `packages/server/src/modules/chat/chat.service.ts` |
| Provider API Key 管理 | `packages/server/src/modules/settings/settings.service.ts` |
| 新增模型服务商 | `packages/server/src/modules/providers/` |

## 计划

- [ ] 会话搜索
- [ ] 自定义系统提示词
- [ ] 图片 / 文件上传
- [ ] 更多模型服务商接入

## License

MIT
