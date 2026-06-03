import { IsString, IsOptional } from 'class-validator';

export class ConnectProviderDto {
  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;
}
