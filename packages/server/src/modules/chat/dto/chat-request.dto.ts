import { IsArray, IsString, IsBoolean, IsOptional } from 'class-validator';
import type { UIMessage } from 'ai';

export class ChatRequestDto {
  @IsArray()
  messages!: UIMessage[];

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsBoolean()
  @IsOptional()
  enableThinking?: boolean;
}
