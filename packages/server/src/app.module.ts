import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './modules/health';
import { ChatModule } from './modules/chat';
import { SettingsModule } from './modules/settings/settings.module';
import { SessionsModule } from './modules/sessions/sessions.module';

@Module({
  imports: [ConfigModule, HealthModule, SettingsModule, SessionsModule, ChatModule],
})
export class AppModule {}
