import { IsOptional, IsString, IsNumber } from "class-validator";

export class ProfileFieldOptionDto {
  @IsString()
  label: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
