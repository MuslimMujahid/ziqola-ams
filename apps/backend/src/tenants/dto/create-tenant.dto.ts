import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

const EDUCATION_LEVEL_VALUES = ["SD", "SMP", "SMA", "SMK", "OTHER"] as const;

export type EducationLevel = (typeof EDUCATION_LEVEL_VALUES)[number];

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsIn(EDUCATION_LEVEL_VALUES)
  educationLevel?: EducationLevel;
}
