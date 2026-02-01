import { IsUUID } from "class-validator";

export class RequestAssessmentRecapChangeDto {
  @IsUUID()
  classSubjectId: string;

  @IsUUID()
  periodId: string;
}
