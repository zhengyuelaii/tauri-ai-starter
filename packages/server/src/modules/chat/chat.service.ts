import { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import {
  streamText,
  generateText,
  convertToModelMessages,
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
} from './providers';
import type { ChatRequestDto } from './dto/chat-request.dto';
import { SettingsService } from '../settings/settings.service';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly sessionsService: SessionsService,
  ) {}

  async streamChat(request: ChatRequestDto, res: Response) {
    let { messages } = request;
    const platformKey = request.provider ?? 'siliconflow';
    const modelKey = request.model ?? 'v4-flash';
    const enableThinking = request.enableThinking ?? false;

    if (request.sessionId) {
      const dbMessages = await this.sessionsService.getAllMessages(request.sessionId);
      const dbIds = new Set(dbMessages.map((m) => m.id));
      const newMessages = messages.filter((m) => !dbIds.has(m.id));
      messages = [...dbMessages, ...newMessages] as any;
    }

    const strategy = getStrategy(platformKey);
    if (!strategy) {
      res.status(400).json({ error: `Unknown platform: ${platformKey}` });
      return;
    }

    const apiModelId = resolveModelId(platformKey, modelKey);
    if (!apiModelId) {
      res
        .status(400)
        .json({
          error: `Unknown model "${modelKey}" for platform "${platformKey}"`,
        });
      return;
    }

    const apiKey = await this.settingsService.getApiKey(platformKey);
    if (!apiKey) {
      res
        .status(500)
        .json({ error: `API key not configured for platform: ${platformKey}` });
      return;
    }

    const userBaseUrl = await this.settingsService.getBaseUrl(platformKey);
    const baseURL = userBaseUrl ?? (strategy.key === 'siliconflow'
      ? 'https://api.siliconflow.cn/v1'
      : 'https://api.deepseek.com/v1');

    const provider = requireProvider(platformKey, apiKey, baseURL);
    const thinkingConfig = getThinkingConfig(platformKey, enableThinking);

    const modelOpts: Record<string, unknown> = {};
    if (thinkingConfig.transformRequestBody) {
      modelOpts.transformRequestBody = thinkingConfig.transformRequestBody;
    }
    const model = provider.languageModel(apiModelId, modelOpts);

    const result = streamText({
      model,
      system:
        '你是一个专业、严谨的AI助手。请保持严肃专业的语气，不要使用任何表情符号（emoji）。回答应简洁、准确、客观。',
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      providerOptions: (thinkingConfig.providerOptions ?? {}) as any,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return { location, temperature };
          },
        }),
        convertFahrenheitToCelsius: tool({
          description: 'Convert a temperature in fahrenheit to celsius',
          inputSchema: z.object({
            temperature: z
              .number()
              .describe('The temperature in fahrenheit to convert'),
          }),
          execute: async ({ temperature }) => {
            const celsius = Math.round((temperature - 32) * (5 / 9));
            return { celsius };
          },
        }),
      },
    });

    const response = result.toUIMessageStreamResponse({
      sendReasoning: enableThinking,
    });

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(response.status);

    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  }

  async generateTitle(provider: string, model: string, message: string) {
    const platformKey = provider || 'siliconflow';
    const modelKey = model || 'v4-flash';

    const strategy = getStrategy(platformKey);
    if (!strategy) {
      throw new Error(`Unknown platform: ${platformKey}`);
    }

    const apiModelId = resolveModelId(platformKey, modelKey);
    if (!apiModelId) {
      throw new Error(`Unknown model "${modelKey}" for platform "${platformKey}"`);
    }

    const apiKey = await this.settingsService.getApiKey(platformKey);
    if (!apiKey) {
      throw new Error(`API key not configured for platform: ${platformKey}`);
    }

    const userBaseUrl = await this.settingsService.getBaseUrl(platformKey);
    const baseURL = userBaseUrl ?? (strategy.key === 'siliconflow'
      ? 'https://api.siliconflow.cn/v1'
      : 'https://api.deepseek.com/v1');

    const aiProvider = requireProvider(platformKey, apiKey, baseURL);
    const langModel = aiProvider.languageModel(apiModelId);

    const { text } = await generateText({
      model: langModel,
      system: '你是一个标题生成器。根据用户的消息，生成一个简短的对话标题（4-10个字）。只返回标题本身，不要加引号、标点或任何解释。',
      prompt: message,
    });

    return text.trim();
  }
}
