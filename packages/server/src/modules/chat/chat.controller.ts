import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { GenerateTitleDto } from './dto/generate-title.dto';

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  async chat(@Body() body: ChatRequestDto, @Res() res: Response) {
    await this.chatService.streamChat(body, res);
  }

  @Post('chat/generate-title')
  @HttpCode(200)
  async generateTitle(@Body() body: GenerateTitleDto) {
    const title = await this.chatService.generateTitle(
      body.provider,
      body.model,
      body.message,
    );
    return { title };
  }
}
