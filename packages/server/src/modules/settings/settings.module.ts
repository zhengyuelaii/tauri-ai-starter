import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { db, SETTINGS_DB } from './db';

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    { provide: SETTINGS_DB, useValue: db },
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
