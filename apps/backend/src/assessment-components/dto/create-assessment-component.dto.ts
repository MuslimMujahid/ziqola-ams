import { Transform } from "class-transformer";
import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateAssessmentComponentDto {
  @IsUUID()
  classSubjectId: string;

  @IsUUID()
  academicPeriodId: string;

  @IsUUID()
  assessmentTypeId: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
