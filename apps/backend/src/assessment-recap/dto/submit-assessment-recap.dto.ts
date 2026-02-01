import { IsUUID } from "class-validator";

export class SubmitAssessmentRecapDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  periodId: string;
}
