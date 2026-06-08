import { IsString, IsUrl, IsArray, ValidateNested, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomModelDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  modelId: string;

  @IsBoolean()
  supportsThinking: boolean;
}

export class CreateCustomProviderDto {
  @IsString()
  name: string;

  @IsUrl({ require_tld: false })
  baseUrl: string;

  @IsString()
  apiKey: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomModelDto)
  models: CustomModelDto[];
}

export class UpdateCustomProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomModelDto)
  models?: CustomModelDto[];
}
