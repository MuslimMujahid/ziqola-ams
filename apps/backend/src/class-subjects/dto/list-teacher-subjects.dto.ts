import { IsOptional, IsUUID } from "class-validator";

export class ListTeacherSubjectsDto {
  @IsUUID()
  academicYearId: string;

  @IsOptional()
  @IsUUID()
  teacherProfileId?: string;
}
