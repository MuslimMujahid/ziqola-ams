import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

import {
  ACADEMIC_PERIOD_STATUS,
  type AcademicPeriodStatus,
} from "./academic-period-status";

const SORT_ORDER = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_ORDER)[number];

export class AcademicPeriodQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsEnum(ACADEMIC_PERIOD_STATUS)
  status?: AcademicPeriodStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(SORT_ORDER)
  order?: SortOrder;
}
