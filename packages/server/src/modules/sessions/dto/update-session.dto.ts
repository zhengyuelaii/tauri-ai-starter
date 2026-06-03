import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSessionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  providerKey?: string;

  @IsString()
  @IsOptional()
  modelId?: string;

  @IsBoolean()
  @IsOptional()
  enableThinking?: boolean;
}
