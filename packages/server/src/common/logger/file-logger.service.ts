import { LoggerService } from '@nestjs/common';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const LOG_DIR = join(homedir(), '.tauri-ai-starter', 'logs');
const LOG_FILE = join(LOG_DIR, 'server.log');
const FLUSH_INTERVAL = 5000;

export class FileLogger implements LoggerService {
  private buffer: string[] = [];
  private timer: ReturnType<typeof setInterval>;

  constructor() {
    mkdirSync(LOG_DIR, { recursive: true });
    writeFileSync(LOG_FILE, '');

    const ts = new Date().toISOString();
    appendFileSync(LOG_FILE, `[${ts}] [INFO] Sidecar started\n`);

    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL);

    process.on('exit', () => this.flush());
    process.on('SIGTERM', () => { this.flush(); });
    process.on('SIGINT', () => { this.flush(); });
  }

  log(message: unknown, context?: string) {
    this.emit('INFO', message, context);
  }

  error(message: unknown, context?: string, trace?: string) {
    const msg = trace ? `${message}\n${trace}` : message;
    this.emit('ERROR', msg, context);
  }

  warn(message: unknown, context?: string) {
    this.emit('WARN', message, context);
  }

  debug(message: unknown, context?: string) {
    this.emit('DEBUG', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.emit('VERBOSE', message, context);
  }

  private emit(level: string, message: unknown, context?: string) {
    const ts = new Date().toISOString();
    const ctx = context ? ` [${context}]` : '';
    const line = `[${ts}] [${level}]${ctx} ${message}`;
    this.buffer.push(line);
  }

  private flush() {
    if (this.buffer.length === 0) return;
    const lines = this.buffer.splice(0).join('\n') + '\n';
    try {
      appendFileSync(LOG_FILE, lines);
    } catch { /* best effort */ }
  }
}
