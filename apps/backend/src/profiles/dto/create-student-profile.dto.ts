import { IsObject, IsOptional, IsUUID } from "class-validator";

export class CreateStudentProfileDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
