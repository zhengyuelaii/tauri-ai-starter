# tauri-monorepo-app

pnpm monorepo with Tauri + Vue desktop app and NestJS backend.

## Structure

```
├── packages/
│   ├── desktop/   ← Tauri v2 + Vue 3 + TypeScript
│   └── server/    ← NestJS 11 API server
├── package.json
└── pnpm-workspace.yaml
```

## Getting started

```bash
pnpm install
```

### Desktop

```bash
pnpm tauri:dev    # start Tauri desktop app
pnpm tauri build  # production build
```

### Server

```bash
pnpm server:dev   # start NestJS (http://localhost:3000)
pnpm server:build # production build
pnpm server:test  # run tests
```
