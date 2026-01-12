import { IsObject, IsOptional, IsString } from "class-validator";

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  nis?: string;

  @IsOptional()
  @IsString()
  nisn?: string;

  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
