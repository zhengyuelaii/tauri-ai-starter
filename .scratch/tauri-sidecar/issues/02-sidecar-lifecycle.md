# Sidecar 生命周期完善（优雅关闭 + 错误消息修正）

Status: ready-for-agent

## What to build

当前 sidecar 生命周期管理存在三个缺陷：

1. **无优雅关闭**：关闭窗口时直接 `child.kill()`（相当于 SIGKILL），NestJS 没有机会关闭数据库连接、刷新日志或完成进行中的请求。
2. **错误消息误导**：spawn 失败的 error 消息在所有环境中都打印 `"(dev mode, skipping)"`，但代码中没有 `tauri::is_dev()` 判断。生产构建中 sidecar 启动失败同样被静默跳过，用户无从排查。
3. **Mutex poison panic**：`lock().unwrap()` 在 mutex poisoned 时会 panic，可能导致关闭窗口时 sidecar 进程变成僵尸进程。

**参考**：desktop-tracker-suite 的 `terminate_std_child()` 实现 250ms 轮询 × 5 秒超时的优雅关闭流程。

## Acceptance criteria

- [ ] 关闭窗口时先尝试 `child.kill()`（发送 SIGTERM），等待最多 3 秒让子进程自行退出
- [ ] 超时后仍未退出则强制终止（平台上等效 SIGKILL 的方式）
- [ ] spawn 失败的错误消息中移除硬编码的 `"(dev mode, skipping)"`，改为区分场景的日志
- [ ] `Mutex::lock()` 替换为 `lock().unwrap_or_else(|e| e.into_inner())` 防止 poison panic
- [ ] 关闭窗口后 `lsof -i :3000` 无残留进程
- [ ] 开发模式下 sidecar 未配置时行为不变（不 panic）

## Blocked by

None — can start immediately。
