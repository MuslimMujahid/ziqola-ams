import { IsIn, IsOptional, IsString } from "class-validator";

const EDUCATION_LEVEL_VALUES = ["SD", "SMP", "SMA", "SMK", "OTHER"] as const;

export type EducationLevel = (typeof EDUCATION_LEVEL_VALUES)[number];

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsIn(EDUCATION_LEVEL_VALUES)
  educationLevel?: EducationLevel;
}
