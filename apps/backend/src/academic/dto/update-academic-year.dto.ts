import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateAcademicYearDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  label?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
