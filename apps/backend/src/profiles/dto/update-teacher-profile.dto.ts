import { IsDateString, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsString()
  nip?: string;

  @IsOptional()
  @IsString()
  nuptk?: string;

  @IsOptional()
  @IsDateString()
  hiredAt?: string;

  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
