# 健康检查 API 端点

Status: ready-for-agent

## Parent

[Welcome Page + Health Check PRD](../PRD.md)

## What to build

在 NestJS server 中新增 `GET /health` 端点，返回服务器健康状态 JSON，并编写 HTTP 层测试。

响应体结构：
```json
{
  "status": "ok",
  "timestamp": "2026-06-01T12:00:00.000Z",
  "version": "0.0.1"
}
```

版本号从 server 包自身的 `package.json` 读取，时间戳在每次请求时生成。

已有 `GET /` 返回字符串，测试风格为 `Test.createTestingModule` + 直接调用 controller 方法。本次用 supertest 做 HTTP 层测试，测试外部行为而非实现细节。

## Acceptance criteria

- [ ] `GET /health` 返回 200 和 JSON 体，包含 `status: "ok"`、`timestamp`（ISO 8601 字符串）、`version`（非空字符串）
- [ ] supertest 测试验证响应结构和字段类型
- [ ] `GET /` 已有行为不变，已有测试仍然通过
- [ ] `pnpm server:test` 全部通过

## Blocked by

None — 可立即开始
