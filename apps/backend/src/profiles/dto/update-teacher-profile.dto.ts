import { IsDateString, IsObject, IsOptional } from "class-validator";

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsDateString()
  hiredAt?: string;

  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
