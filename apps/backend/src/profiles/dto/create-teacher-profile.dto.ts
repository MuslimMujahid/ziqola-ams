import { IsDateString, IsObject, IsOptional, IsUUID } from "class-validator";

export class CreateTeacherProfileDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsDateString()
  hiredAt?: string;

  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
