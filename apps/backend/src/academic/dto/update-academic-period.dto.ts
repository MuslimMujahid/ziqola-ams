import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import {
  ACADEMIC_PERIOD_STATUS,
  type AcademicPeriodStatus,
} from "./academic-period-status";

export class UpdateAcademicPeriodDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ACADEMIC_PERIOD_STATUS)
  status?: AcademicPeriodStatus;
}
