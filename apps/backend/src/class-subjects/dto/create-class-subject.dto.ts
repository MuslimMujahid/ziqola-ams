import { IsUUID } from "class-validator";

export class CreateClassSubjectDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  academicYearId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  teacherProfileId: string;
}
