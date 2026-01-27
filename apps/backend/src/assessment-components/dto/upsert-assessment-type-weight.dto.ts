import { Transform } from "class-transformer";
import { IsInt, IsUUID, Max, Min } from "class-validator";

export class UpsertAssessmentTypeWeightDto {
  @IsUUID()
  teacherSubjectId: string;

  @IsUUID()
  academicPeriodId: string;

  @IsUUID()
  assessmentTypeId: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  weight: number;
}
