import { IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateStudentProfileDto {
  @IsUUID()
  userId: string;

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
