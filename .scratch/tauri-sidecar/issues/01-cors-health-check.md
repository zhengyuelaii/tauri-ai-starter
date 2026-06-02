# 生产环境 CORS + 健康检查连接修复

Status: ready-for-agent

## What to build

当前 `/health` 在生产环境无法连通有两个根因：

1. **CORS 缺失**：Tauri 生产模式下 webview origin 是 `tauri://localhost` 或 `https://tauri.localhost`，而健康检查 fetch `http://localhost:3000/health` 是跨域请求。浏览器会拦截缺少 `Access-Control-Allow-Origin` 响应头的响应。
2. **健康检查无重试**：前端单次 fetch + 5 秒 AbortController 超时，失败后状态永久停在"未连接"。NestJS sidecar 冷启动（pkg 解压快照 + NestJS bootstrap）可能超过 5 秒。

**目标**：生产构建 .app 打开后自动显示"已连接"，开发模式体验不变。

## Acceptance criteria

- [ ] `NestFactory.create()` 启用 `{ cors: true }` 选项
- [ ] 前端健康检查改为轮询模式：最多 3 次重试，每次间隔 2 秒（总计最长 6 秒等待）
- [ ] 任意一次 fetch 成功即显示"已连接"，无需等待全部重试
- [ ] 所有重试均失败后才显示"未连接"
- [ ] 开发模式下 Vite proxy 行为不变（同源请求，CORS 不影响 dev）
- [ ] 现有单元测试通过

## Blocked by

None — can start immediately.
