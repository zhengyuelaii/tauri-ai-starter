import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const SERVER_PORT = process.env.SERVER_PORT ?? "3000";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [vue(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tauri-monorepo/shared": path.resolve(__dirname, "../../shared/src/index.ts"),
    },
  },

  define: {
    __SERVER_PORT__: JSON.stringify(SERVER_PORT),
  },

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      "/health": `http://localhost:${SERVER_PORT}`,
    },
  },

  test: {
    environment: "jsdom",
    globals: true,
  },
}));
