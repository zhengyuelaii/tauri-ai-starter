import { IsBoolean } from 'class-validator';

export class SetModelEnabledDto {
  @IsBoolean()
  enabled: boolean;
}
