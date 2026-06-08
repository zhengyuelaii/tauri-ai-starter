import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './modules/health';
import { ChatModule } from './modules/chat';
import { SettingsModule } from './modules/settings/settings.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { I18nModule } from './common/i18n/i18n.module';

@Module({
  imports: [ConfigModule, I18nModule, HealthModule, SettingsModule, SessionsModule, ChatModule],
})
export class AppModule {}
