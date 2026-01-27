import { IsOptional, IsUUID } from "class-validator";

export class ListAssessmentComponentsDto {
  @IsOptional()
  @IsUUID()
  classSubjectId?: string;

  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;
}
