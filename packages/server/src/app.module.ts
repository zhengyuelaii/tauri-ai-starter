import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './modules/health';
import { ChatModule } from './modules/chat';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [ConfigModule, HealthModule, SettingsModule, ChatModule],
})
export class AppModule {}
