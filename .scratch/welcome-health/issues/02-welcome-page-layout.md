# Tailwind + shadcn-vue 安装 + 欢迎页静态布局

Status: ready-for-agent

## Parent

[Welcome Page + Health Check PRD](../PRD.md)

## What to build

在 desktop 包中安装并配置 Tailwind CSS v4 + shadcn-vue，将脚手架 App.vue 替换为一个美观的静态欢迎页。

具体步骤：
1. 安装 `tailwindcss`、`@tailwind/vite`，在 vite.config.ts 注册插件，创建主 CSS 文件引入 Tailwind
2. 运行 `npx shadcn-vue@latest init` 初始化 shadcn（自动配置 CSS 变量、基础样式、components.json，处理 Radix Vue 依赖）
3. 重写 App.vue：居中单列布局，展示应用名称和副标题，移除 greet 逻辑、logo 图片、外部链接及所有旧 CSS

欢迎页仅展示静态内容（应用名称 + 副标题），不包含健康状态指示器——那由 #03 实现。

## Acceptance criteria

- [ ] `pnpm -F @tauri-monorepo/desktop dev` 启动后页面展示 Tailwind 风格欢迎页
- [ ] 页面包含应用名称和副标题，居中布局，视觉干净
- [ ] 脚手架残留全部清除（无 greet 表单、无 logo 图片、无外部文档链接）
- [ ] `vue-tsc --noEmit` 类型检查通过
- [ ] shadcn-vue init 完成，`components.json` 存在且配置正确

## Blocked by

None — 可立即开始，与 #01 并行
