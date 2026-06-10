// scripts/dev.js — start Vite + NestJS concurrently with cleanup on exit
const { spawn } = require("child_process");

const children = [];

function cleanup() {
  console.log("[dev] cleaning up child processes...");
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // already exited
    }
  }
}

process.on("SIGINT", () => {
  console.log("[dev] received SIGINT, shutting down...");
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("[dev] received SIGTERM, shutting down...");
  cleanup();
  process.exit(0);
});
process.on("SIGHUP", () => {
  console.log("[dev] received SIGHUP, shutting down...");
  cleanup();
  process.exit(0);
});

// Resolve workspace root (2 levels up from this script)
const workspaceRoot = require("path").resolve(__dirname, "..", "..");

function start(name, args) {
  const child = spawn("pnpm", args, {
    cwd: workspaceRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[dev] ${name} exited with code ${code}`);
      cleanup();
      process.exit(code);
    }
  });

  children.push(child);
  return child;
}

console.log("[dev] Starting Vite + NestJS...");
start("Vite", ["--filter", "@tauri-ai-starter/desktop", "dev"]);
start("NestJS", ["--filter", "@tauri-ai-starter/server", "start:dev"]);
