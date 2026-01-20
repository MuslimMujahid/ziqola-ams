import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

import { PaginationQueryDto } from "../../common";

export class ScheduleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  classSubjectId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  teacherProfileId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(7)
  dayOfWeek?: number;
}
