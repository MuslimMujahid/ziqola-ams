import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import {
  AcademicPeriodSetupDto,
  AcademicYearSetupDto,
} from "./create-academic-setup.dto";

export class CreateAcademicOnboardingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AcademicYearSetupDto)
  year?: AcademicYearSetupDto;

  @ValidateNested()
  @Type(() => AcademicPeriodSetupDto)
  period: AcademicPeriodSetupDto;
}
