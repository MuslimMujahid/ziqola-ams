import { IsObject, IsOptional } from "class-validator";

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
