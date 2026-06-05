import { Injectable } from '@nestjs/common';
import { greet } from '@tauri-ai-starter/shared';
import { DEFAULT_VERSION } from '../../common/constants';

@Injectable()
export class HealthService {
  private readonly version: string;

  constructor() {
    this.version = process.env.npm_package_version ?? DEFAULT_VERSION;
  }

  getHello(): string {
    return greet('World');
  }

  getHealth() {
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      version: this.version,
    };
  }
}
