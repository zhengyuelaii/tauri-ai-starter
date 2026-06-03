import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AddMessageDto } from './dto/add-message.dto';

@Controller('api')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('sessions')
  async list() {
    return this.sessionsService.getSessions();
  }

  @Post('sessions')
  async create(@Body() body: CreateSessionDto) {
    return this.sessionsService.createSession(body);
  }

  @Patch('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() body: UpdateSessionDto) {
    await this.sessionsService.updateSession(id, body);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.sessionsService.deleteSession(id);
  }

  @Get('sessions/:id/messages')
  async messages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.sessionsService.getMessages(
      id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('sessions/:id/messages')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addMessage(@Param('id') id: string, @Body() body: AddMessageDto) {
    await this.sessionsService.addMessage(id, body);
  }
}
