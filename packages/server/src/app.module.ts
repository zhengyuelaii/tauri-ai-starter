import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './modules/health';
import { ChatModule } from './modules/chat';

@Module({
  imports: [ConfigModule, HealthModule, ChatModule],
})
export class AppModule {}
