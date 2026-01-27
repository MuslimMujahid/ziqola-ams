import { IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class CreateTenantAssessmentTypeDto {
  @IsString()
  @MinLength(2)
  key: string;

  @IsString()
  @MinLength(2)
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
