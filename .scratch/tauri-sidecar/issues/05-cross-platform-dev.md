# beforeDevCommand 跨平台开发脚本

Status: ready-for-agent

## What to build

当前 `tauri.conf.json` 的 `beforeDevCommand` 使用内联 shell：

```
pnpm --filter @tauri-monorepo/shared build && (trap 'kill 0' EXIT; pnpm dev & pnpm --filter @tauri-monorepo/server start:dev & wait)
```

存在两个问题：
1. `trap 'kill 0' EXIT` 是 POSIX shell 语法，Windows（cmd/PowerShell）不支持，导致 `pnpm tauri dev` 在 Windows 上失败。
2. 内联脚本无错误传播：如果 `nest start --watch` 因编译错误静默退出，Tauri 照常启动但健康检查失败，开发者看不到明确错误。

**目标**：将开发服务器编排提取为独立脚本，跨平台可用，提供清晰的启动状态反馈。

## Acceptance criteria

- [ ] 创建 `packages/desktop/scripts/dev.js`（或 `.mjs`），使用 Node.js `child_process` 管理 Vite + NestJS 并发启动
- [ ] 任一子进程退出时自动清理另一个（替代 `trap 'kill 0'`）
- [ ] `beforeDevCommand` 改为调用该脚本
- [ ] macOS 上行为不变（回归验证）
- [ ] 脚本至少在 macOS 上可运行（Windows 兼容性作为自然结果）

## Blocked by

None — can start immediately.
