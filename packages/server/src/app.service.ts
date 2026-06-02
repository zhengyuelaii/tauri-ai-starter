import { Injectable } from '@nestjs/common';
import { greet } from '@tauri-monorepo/shared';

const VERSION = process.env.npm_package_version ?? '0.0.2';

@Injectable()
export class AppService {
  getHello(): string {
    return greet('World');
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: VERSION,
    };
  }
}
