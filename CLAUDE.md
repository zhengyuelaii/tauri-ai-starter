# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Tauri v2 monorepo with three packages:

| Package | Stack | Role |
|---|---|---|
| `packages/desktop` | Tauri v2 + Vue 3 + Vite + Tailwind v4 | Desktop app frontend + Rust shell |
| `packages/server` | NestJS 11 + Drizzle ORM + better-sqlite3 | API backend (compiled to Tauri sidecar binary) |
| `packages/shared` | TypeScript only | Shared types/utilities between frontend and backend |

The server runs as a **Tauri sidecar** — compiled to a standalone binary via `@yao-pkg/pkg` and spawned by the Rust process at runtime. SQLite database lives at `~/.tauri-ai-starter/settings.db`.

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
- **i18n** via `vue-i18n`: locale files in `src/locales/{zh-CN,en}.json`, composable in `useLocale.ts`, strings via `useI18n().t('key')`. In plain `.ts` files (outside Vue), import `{ i18n } from '@/composables/useLocale'` and use `i18n.global.t('key')`. Add new strings to both locale JSON files with matching keys.
- **Dark mode** via `useTheme.ts` composable (module-level singleton, same pattern as `useLocale`). Three modes: `light`/`dark`/`system`, persisted to `localStorage` key `tauri-ai-starter-theme`. `initTheme()` called in `main.ts` before `createApp()` to avoid FOUC. `.dark` class toggled on `<html>` + `color-scheme` style for native scrollbars. Tauri native chrome synced via `getCurrentWindow().setTheme()`. System preference detected via `window.matchMedia('(prefers-color-scheme: dark)')` — do NOT use `win.theme()` (returns window theme, not system preference) or trust `onThemeChanged` payload (can fire spuriously from `setTheme()` calls). Shiki code highlighting uses dual themes (`github-light-default` + `github-dark-default`) and switches via the `.dark` CSS class.

### Server (NestJS)

- **Settings module** manages provider API keys (encrypted) and model enable/disable
- **Sessions module** provides CRUD for conversation sessions and messages (pagination via limit/offset)
- **Chat module** handles SSE streaming via AI SDK `streamText()`, with tool calling support
- **Single SQLite database** shared between Settings and Sessions modules — both inject the same `db` object via custom tokens
- **DTOs** use `class-validator` decorators, globally enforced by `ValidationPipe`
- **Module path**: `src/modules/<feature>/` with `dto/` subdirectory
- Controller routes are prefixed with `/api` (except health at `/` and `/health`)

### Server i18n

- **Frontend sends language** via `X-Language` header (`zh-CN` or `en`), injected automatically by `fetchWithTimeout` from `i18n.global.locale.value`
- **`I18nMiddleware`** (`common/i18n/i18n.middleware.ts`) reads the header and enters an `AsyncLocalStorage` context via `langStorage.run({ lang }, () => next())` — all downstream code can read the current language from `i18n.currentLang()`
- **`I18nService`** (`common/i18n/i18n.service.ts`) loads locale data from `locales/{zh-CN,en}.ts` (TypeScript modules, not JSON — avoids build asset issues). Provides `t(key, lang, params?)` with dot-notation keys (`"errors.unknownPlatform"`) and `{param}` interpolation. Falls back to English if a key is missing
- **`I18nException`** (`common/i18n/i18n.exception.ts`) extends `HttpException` with an i18n key + params. Use this instead of `throw new Error()` for any user-facing error
- **`I18nExceptionFilter`** (`common/filters/i18n-exception.filter.ts`) is a global `@Catch()` filter registered via `APP_FILTER`. It translates `I18nException` messages using the request language, and handles `HttpException` and plain `Error` with a generic 500 fallback
- **Prompts** (`chat.service.ts`) use `this.i18n.t('prompts.chat', this.i18n.currentLang())` to select the language-appropriate system prompt
- **Session default title** is generated from `i18n.t('session.defaultTitle', lang)` instead of hardcoded `'新对话'` — English clients get `"New Session"`, Chinese clients get `"新对话"`
- **Adding new translations**: add the key to both `locales/en.ts` and `locales/zh-CN.ts` (the `LocaleData` interface enforces structure), then reference via `I18nService.t()`. Error keys go under `errors.*`, prompt keys under `prompts.*`, session keys under `session.*`

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
