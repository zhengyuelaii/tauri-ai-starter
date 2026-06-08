import { Injectable } from '@nestjs/common';
import {
  streamText,
  generateText,
  convertToModelMessages,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  tool,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import type { Response } from 'express';
import {
  getStrategy,
  requireProvider,
  resolveModelId,
  getThinkingConfig,
} from '../providers';
import type { ChatRequestDto } from './dto/chat-request.dto';
import { SettingsService } from '../settings/settings.service';
import { SessionsService } from '../sessions/sessions.service';
import { I18nService } from '../../common/i18n/i18n.service';
import { I18nException } from '../../common/i18n/i18n.exception';
import type { ThinkingConfig } from '../providers/types';
import type { LanguageModel } from 'ai';

interface PreparedProvider {
  model: LanguageModel;
  thinkingConfig: ThinkingConfig;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly sessionsService: SessionsService,
    private readonly i18n: I18nService,
  ) {}

  private async prepareProvider(
    platformKey: string,
    modelKey: string,
    enableThinking: boolean,
  ): Promise<PreparedProvider> {
    const strategy = getStrategy(platformKey);
    if (!strategy) {
      throw new I18nException(400, 'errors.unknownPlatform', { key: platformKey });
    }

    const apiModelId = resolveModelId(platformKey, modelKey);
    if (!apiModelId) {
      throw new I18nException(400, 'errors.unknownModel', { platform: platformKey, model: modelKey });
    }

    const config = await this.settingsService.getProviderConfig(platformKey);
    if (!config.apiKey) {
      throw new I18nException(400, 'errors.apiKeyNotConfigured', { platform: platformKey });
    }

    const provider = requireProvider(platformKey, config.apiKey, config.baseUrl ?? undefined);
    const thinkingConfig = getThinkingConfig(platformKey, { enabled: enableThinking });

    const modelOpts: Record<string, unknown> = {};
    if (thinkingConfig.transformRequestBody) {
      modelOpts.transformRequestBody = thinkingConfig.transformRequestBody;
    }

    return {
      model: provider.languageModel(apiModelId, modelOpts),
      thinkingConfig,
    };
  }

  async streamChat(request: ChatRequestDto, res: Response) {
    const platformKey = request.provider ?? 'siliconflow';
    const modelKey = request.model ?? 'v4-flash';
    const enableThinking = request.enableThinking ?? false;

    const prepared = await this.prepareProvider(platformKey, modelKey, enableThinking);

    let { messages } = request;
    if (request.sessionId) {
      const dbMessages = await this.sessionsService.getAllMessages(request.sessionId);
      const dbIds = new Set(dbMessages.map((m) => m.id));
      const newMessages = messages.filter((m) => !dbIds.has(m.id));
      messages = [...dbMessages, ...newMessages] as any;
    }

    const modelMessages = await convertToModelMessages(messages);

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const result = streamText({
          model: prepared.model,
          system: this.i18n.t('prompts.chat', this.i18n.currentLang()),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          providerOptions: (prepared.thinkingConfig.providerOptions ?? {}) as any,
          tools: {
            weather: tool({
              description: 'Get the weather in a location (fahrenheit)',
              inputSchema: z.object({
                location: z.string().describe('The location to get the weather for'),
              }),
              execute: async ({ location }) => {
                const temperature = Math.round(Math.random() * (90 - 32) + 32);
                return { location, temperature };
              },
            }),
            convertFahrenheitToCelsius: tool({
              description: 'Convert a temperature in fahrenheit to celsius',
              inputSchema: z.object({
                temperature: z.number().describe('The temperature in fahrenheit to convert'),
              }),
              execute: async ({ temperature }) => {
                const celsius = Math.round((temperature - 32) * (5 / 9));
                return { celsius };
              },
            }),
          },
        });

        writer.merge(
          result.toUIMessageStream({
            sendReasoning: enableThinking,
            onError: (error) =>
              error instanceof Error ? error.message : String(error),
          }),
        );
      },
    });

    pipeUIMessageStreamToResponse({ stream, response: res });
  }

  async generateTitle(provider: string, model: string, message: string) {
    const prepared = await this.prepareProvider(
      provider || 'siliconflow',
      model || 'v4-flash',
      false,
    );

    const generateOptions: Record<string, unknown> = {
      model: prepared.model,
      system: this.i18n.t('prompts.title', this.i18n.currentLang()),
      prompt: message,
    };
    if (prepared.thinkingConfig.providerOptions) {
      generateOptions.providerOptions = prepared.thinkingConfig.providerOptions;
    }

    const { text } = await generateText(generateOptions as any);
    return text.trim();
  }
}
