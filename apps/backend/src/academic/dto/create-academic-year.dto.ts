import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

const ACADEMIC_YEAR_STATUS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export type AcademicYearStatus = (typeof ACADEMIC_YEAR_STATUS)[number];

export class CreateAcademicYearDto {
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
