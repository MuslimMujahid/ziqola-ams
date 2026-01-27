import { IsUUID } from "class-validator";

export class ListAssessmentTypeWeightsDto {
  @IsUUID()
  teacherSubjectId: string;

  @IsUUID()
  academicPeriodId: string;
}
