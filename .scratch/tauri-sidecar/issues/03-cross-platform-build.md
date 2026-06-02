# 跨平台构建脚本修复

Status: ready-for-agent

## What to build

`build:sidecar` 脚本当前有三处平台兼容性问题：

1. **pkg target 硬编码**：`--targets node22-macos-arm64` 仅支持 Apple Silicon Mac。Intel Mac / Windows / Linux 上构建会失败。
2. **`fs.renameSync` EXDEV**：跨文件系统（如 CI Docker bind mount）时 `renameSync` 报 `EXDEV: cross-device link` 错误。
3. **依赖 `rustc`**：`move-sidecar.js` 通过 `rustc -Vv` 获取目标三元组，但这是纯 Node.js 打包步骤，不应依赖 Rust 工具链。

**目标**：`build:sidecar` 在任意平台正常产出正确架构的 binary。

## Acceptance criteria

- [ ] pkg `--targets` 从环境变量或 `process.arch`/`process.platform` 自动推导，不再硬编码
- [ ] `move-sidecar.js` 中 `fs.renameSync` 改为 `fs.copyFileSync` + `fs.unlinkSync`
- [ ] 目标三元组从 `process.arch` + `process.platform` 推导（映射表覆盖 aarch64→arm64, x64→x64, darwin→apple-darwin 等），不再调用 `rustc`
- [ ] `build:sidecar` 在 Apple Silicon Mac 上行为不变（回归验证）

## Blocked by

None — can start immediately.
