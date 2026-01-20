import { IsOptional, IsUUID } from "class-validator";

import { PaginationQueryDto } from "../../common";

export class ClassSubjectQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  teacherProfileId?: string;
}
