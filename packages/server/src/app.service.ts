import { Injectable } from '@nestjs/common';
import { greet } from '@tauri-monorepo/shared';

@Injectable()
export class AppService {
  getHello(): string {
    return greet('World');
  }
}
