import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { ConnectProviderDto } from './dto/connect-provider.dto';
import { SetModelEnabledDto } from './dto/set-model-enabled.dto';

@Controller('api')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('platforms')
  getPlatforms() {
    return this.settingsService.getPlatformsMetadata();
  }

  @Get('settings/providers')
  getProviders() {
    return this.settingsService.getProviders();
  }

  @Put('settings/providers/:key')
  async connectProvider(
    @Param('key') key: string,
    @Body() body: ConnectProviderDto,
  ) {
    await this.settingsService.connectProvider(key, body.apiKey, body.baseUrl);
    return { ok: true };
  }

  @Delete('settings/providers/:key')
  async disconnectProvider(@Param('key') key: string) {
    await this.settingsService.disconnectProvider(key);
    return { ok: true };
  }

  @Put('settings/models/:providerKey/:modelId')
  async setModelEnabled(
    @Param('providerKey') providerKey: string,
    @Param('modelId') modelId: string,
    @Body() body: SetModelEnabledDto,
  ) {
    await this.settingsService.setModelEnabled(
      providerKey,
      modelId,
      body.enabled,
    );
    return { ok: true };
  }
}
