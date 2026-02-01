import { IsInt, IsUUID, Max, Min } from "class-validator";

export class UpdateAssessmentRecapKkmDto {
  @IsUUID()
  classSubjectId: string;

  @IsInt()
  @Min(0)
  @Max(100)
  kkm: number;
}
