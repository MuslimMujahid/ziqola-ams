import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  Min,
} from "class-validator";

const ACADEMIC_PERIOD_STATUS = ["DRAFT", "ARCHIVED"] as const;

export type AcademicPeriodStatus = (typeof ACADEMIC_PERIOD_STATUS)[number];

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
  @IsInt()
  @Min(1)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  makeActive?: boolean;
}
