# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Tauri v2 monorepo with three packages:

| Package | Stack | Role |
|---|---|---|
| `packages/desktop` | Tauri v2 + Vue 3 + Vite + Tailwind v4 | Desktop app frontend + Rust shell |
| `packages/server` | NestJS 11 + Drizzle ORM + better-sqlite3 | API backend (compiled to Tauri sidecar binary) |
| `packages/shared` | TypeScript only | Shared types/utilities between frontend and backend |

The server runs as a **Tauri sidecar** — compiled to a standalone binary via `@yao-pkg/pkg` and spawned by the Rust process at runtime. SQLite database lives at `~/.nativai-template/settings.db`.

Frontend communicates with the NestJS backend over HTTP (`localhost:3000` in dev). In production, the sidecar is bundled in the Tauri app bundle.

**Window creation is programmatic** (in `lib.rs`), not from `tauri.conf.json`. This enables macOS overlay titlebar (`TitleBarStyle::Overlay`) with custom traffic light positioning.

**AI providers** use a Strategy pattern (`packages/server/src/modules/chat/providers/`). Currently supports SiliconFlow and DeepSeek, both via `@ai-sdk/openai-compatible`. API keys are AES-256-GCM encrypted in SQLite.

## Commands

```bash
# Development
pnpm install                    # install all dependencies (requires pnpm >= 11.4)
pnpm dev                        # start both Vite frontend + NestJS backend
pnpm tauri:dev                  # start full Tauri desktop app
pnpm web:dev                    # start frontend only (Vite, port 1420)
pnpm server:dev                 # start backend only (NestJS watch mode, port 3000)

# Build
pnpm server:build               # build NestJS only
pnpm server:build:sidecar       # build NestJS → standalone binary for Tauri sidecar
pnpm tauri build                # production Tauri build (includes sidecar compilation)

# Test
pnpm server:test                # NestJS Jest tests
pnpm desktop:test               # Desktop Vitest tests

# Frontend type-check (from packages/desktop)
cd packages/desktop && pnpm vue-tsc --noEmit

# Rust build (from packages/desktop/src-tauri)
cd packages/desktop/src-tauri && cargo build
```

## Key patterns

### Desktop (Vue 3)

- **Composables** (`src/composables/`) for all stateful logic: `useChatSession`, `usePlatforms`, `useScrollToBottom`, `useToast`
- **UI components** from shadcn-vue (Reka UI + Tailwind), located in `src/components/ui/`
- **API layer** in `src/api/`: `fetchWithTimeout` wraps all requests, `BASE_URL` from `api/constants.ts`
- **TitleBar** (`src/components/layout/TitleBar.vue`) handles window drag via JS `getCurrentWindow().startDragging()` API — do NOT use `data-tauri-drag-region` (blocks text selection)
- **ChatMessage** renders markdown via Comark with KaTeX math and Shiki syntax highlighting
- Styles use Tailwind v4 CSS-first config (`@theme inline` in `index.css`) — no `tailwind.config.js`
- CSP is disabled (`null` in tauri.conf.json)

### Server (NestJS)

- **Settings module** manages provider API keys (encrypted) and model enable/disable
- **Sessions module** provides CRUD for conversation sessions and messages (pagination via limit/offset)
- **Chat module** handles SSE streaming via AI SDK `streamText()`, with tool calling support
- **Single SQLite database** shared between Settings and Sessions modules — both inject the same `db` object via custom tokens
- **DTOs** use `class-validator` decorators, globally enforced by `ValidationPipe`
- **Module path**: `src/modules/<feature>/` with `dto/` subdirectory
- Controller routes are prefixed with `/api` (except health at `/` and `/health`)

### Sidecar

The `build:sidecar` script compiles the NestJS server to a standalone Node.js binary placed at `packages/desktop/src-tauri/binaries/server-{target-triple}`. The binary bundles `better_sqlite3` native addon (configured in server's `package.json` under `pkg.assets`).

In dev mode, the sidecar is NOT spawned — the NestJS server runs as a separate process via `dev.cjs`.

## API routes

```
GET  /health
POST /api/chat                    (SSE streaming)
POST /api/chat/generate-title
GET  /api/platforms
GET  /api/settings/providers
PUT  /api/settings/providers/:key
PUT  /api/settings/models/:providerKey/:modelId
GET  /api/sessions
POST /api/sessions
PATCH /api/sessions/:id
DELETE /api/sessions/:id
GET  /api/sessions/:id/messages
POST /api/sessions/:id/messages
```
