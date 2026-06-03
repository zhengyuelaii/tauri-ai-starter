import { IsString, IsArray } from 'class-validator';

export class AddMessageDto {
  @IsString()
  id!: string;

  @IsString()
  role!: string;

  @IsArray()
  parts!: unknown[];

  @IsString()
  createdAt!: string;
}
