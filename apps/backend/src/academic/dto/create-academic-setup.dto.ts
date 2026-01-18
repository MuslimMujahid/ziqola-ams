import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ACADEMIC_PERIOD_STATUS,
  type AcademicPeriodStatus,
} from "./academic-period-status";

export class AcademicYearSetupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(50)
  label: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AcademicPeriodSetupDto {
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

export class CreateAcademicSetupDto {
  @ValidateNested()
  @Type(() => AcademicYearSetupDto)
  year: AcademicYearSetupDto;

  @ValidateNested()
  @Type(() => AcademicPeriodSetupDto)
  period: AcademicPeriodSetupDto;
}
