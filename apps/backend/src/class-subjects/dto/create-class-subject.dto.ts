import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class CreateClassSubjectDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  academicYearId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  teacherProfileId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  kkm?: number;
}
