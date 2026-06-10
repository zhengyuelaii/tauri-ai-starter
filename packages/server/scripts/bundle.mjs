// bundle.mjs — esbuild pre-bundle to resolve drizzle-orm subpath exports before pkg
import esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distSrc = join(__dirname, '..', 'dist', 'src');
const outDir = join(__dirname, '..', 'dist-bundle');

mkdirSync(outDir, { recursive: true });

// Console Ninja VSCode extension injects build hooks that reference these modules.
// Always externalize them — they are not used by the application.
const consoleNinjaExternals = ['whiskers', 'just', 'dot', 'ractive', 'vash', 'twing'];

const banner = `\
// Pre-bootstrap crash capture — must run before any require() calls.
// Once NestJS starts, the FileLogger service takes over all logging.
var __fs = require('node:fs');
var __path = require('node:path');
var __os = require('node:os');
var __LOG_FILE = __path.join(__os.homedir(), '.tauri-ai-starter', 'logs', 'server.log');
__fs.mkdirSync(__path.dirname(__LOG_FILE), { recursive: true });

function __crash(kind, msg) {
  try { __fs.appendFileSync(__LOG_FILE, '[' + new Date().toISOString() + '] [' + kind + '] ' + msg + '\\n'); } catch (e) {}
}

process.on('uncaughtException', function(err) {
  __crash('FATAL', err.stack || err.message);
  process.exit(1);
});

process.on('unhandledRejection', function(reason) {
  __crash('FATAL', 'Unhandled rejection: ' + (reason && reason.stack ? reason.stack : String(reason)));
});
`;

await esbuild.build({
  entryPoints: [join(distSrc, 'main.js')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: join(outDir, 'main.js'),
  banner: { js: banner },
  external: [
    // NestJS optional transport deps — not used but NestJS references them via optionalRequire
    '@nestjs/microservices',
    '@nestjs/websockets',
    // Console Ninja injections (if any)
    ...consoleNinjaExternals,
  ],
});

console.log('bundle: dist-bundle/main.js written');
