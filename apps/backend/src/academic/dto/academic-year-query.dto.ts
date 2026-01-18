import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

import {
  ACADEMIC_YEAR_STATUS,
  type AcademicYearStatus,
} from "./academic-year-status";

const SORT_ORDER = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_ORDER)[number];

export class AcademicYearQueryDto {
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
  @IsEnum(ACADEMIC_YEAR_STATUS)
  status?: AcademicYearStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(SORT_ORDER)
  order?: SortOrder;
}
