import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const ACADEMIC_YEAR_STATUS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const ACADEMIC_PERIOD_STATUS = ["DRAFT", "ARCHIVED"] as const;

export type AcademicYearStatus = (typeof ACADEMIC_YEAR_STATUS)[number];
export type AcademicPeriodStatus = (typeof ACADEMIC_PERIOD_STATUS)[number];

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

  @IsOptional()
  @IsEnum(ACADEMIC_YEAR_STATUS)
  status?: AcademicYearStatus;

  @IsOptional()
  @IsBoolean()
  makeActive?: boolean;
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
  @IsInt()
  @Min(1)
  orderIndex?: number;

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
