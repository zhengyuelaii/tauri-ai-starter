import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateTitleDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
