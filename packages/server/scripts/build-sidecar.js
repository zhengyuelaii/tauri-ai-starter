// build-sidecar.js — compile NestJS to standalone binary and place it in Tauri's binaries/ directory
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 1. Detect pkg target from Node.js runtime (no rustc dependency)
const NODE_MAJOR = Math.min(parseInt(process.versions.node.split(".")[0], 10), 22);
const pkgArch = process.arch === "arm64" ? "arm64" : "x64";
const pkgPlatform =
  process.platform === "darwin"
    ? "macos"
    : process.platform === "win32"
      ? "win"
      : "linux";
const pkgTarget = `node${NODE_MAJOR}-${pkgPlatform}-${pkgArch}`;

// 2. Detect Tauri sidecar target triple from process.arch/process.platform
const TRIPLE_MAP = {
  "darwin-arm64": "aarch64-apple-darwin",
  "darwin-x64": "x86_64-apple-darwin",
  "win32-x64": "x86_64-pc-windows-msvc",
  "linux-x64": "x86_64-unknown-linux-gnu",
  "linux-arm64": "aarch64-unknown-linux-gnu",
};
const tripleKey = `${process.platform}-${pkgArch}`;
const targetTriple = TRIPLE_MAP[tripleKey];
if (!targetTriple) {
  console.error(`build-sidecar: unsupported platform/arch: ${tripleKey}`);
  process.exit(1);
}

// 3. Run pkg to compile NestJS into standalone binary
const distDir = path.join(__dirname, "..", "dist");
const distBinaryDir = path.join(__dirname, "..", "dist-binary");
fs.mkdirSync(distBinaryDir, { recursive: true });

const ext = process.platform === "win32" ? ".exe" : "";
const binaryName = `server${ext}`;
const pkgOutput = path.join(distBinaryDir, binaryName);

console.log(`build-sidecar: pkg target=${pkgTarget}`);
execSync(
  `npx pkg "${path.join(distDir, "main.js")}" --targets ${pkgTarget} --output "${pkgOutput}"`,
  { stdio: "inherit" },
);

// 4. Copy to Tauri binaries/ with sidecar naming convention (copyFileSync + unlinkSync for cross-device safety)
const destDir = path.join(
  __dirname,
  "..",
  "..",
  "desktop",
  "src-tauri",
  "binaries",
);
const destName = `server-${targetTriple}${ext}`;
const dest = path.join(destDir, destName);

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(pkgOutput, dest);
fs.unlinkSync(pkgOutput);

console.log(`build-sidecar: ${pkgOutput} -> ${dest}`);
