import { IsOptional, IsUUID } from "class-validator";

export class ListAssessmentRecapDto {
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;
}
