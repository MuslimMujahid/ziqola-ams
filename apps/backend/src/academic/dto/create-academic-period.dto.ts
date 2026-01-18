import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

import {
  ACADEMIC_PERIOD_STATUS,
  type AcademicPeriodStatus,
} from "./academic-period-status";

export class CreateAcademicPeriodDto {
  @IsUUID()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(ACADEMIC_PERIOD_STATUS)
  status?: AcademicPeriodStatus;

  @IsOptional()
  @IsBoolean()
  makeActive?: boolean;
}
