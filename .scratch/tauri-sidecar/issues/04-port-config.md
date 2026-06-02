# 端口配置统一为单一来源

Status: ready-for-agent

## What to build

当前端口 `3000` 在三个文件中作为字面量硬编码：
- `vite.config.ts` — proxy `/health` → `localhost:3000`
- `App.vue` — production health URL `http://localhost:3000/health`
- `main.ts` — `process.env.PORT ?? 3000`

改端口需同步修改三处，容易遗漏导致生产环境"未连接"。

**目标**：端口值通过单一来源（环境变量 `SERVER_PORT`）注入，修改一处即可同时更新 dev 和 production。

## Acceptance criteria

- [ ] `App.vue` 中 production URL 的端口通过 Vite `define` 在构建时注入（来源为 `SERVER_PORT` 环境变量，默认 `3000`）
- [ ] `vite.config.ts` 中 proxy 目标的端口从同一环境变量读取
- [ ] `main.ts` 保持 `process.env.PORT` 支持（sidecar 运行时端口由 sidecar spawn 时通过 env 参数传入）
- [ ] 修改 `SERVER_PORT=3001` 后，dev 和 production 模式均正常连接
- [ ] 不传 `SERVER_PORT` 时默认行为不变（端口 3000）

## Blocked by

None — can start immediately.
