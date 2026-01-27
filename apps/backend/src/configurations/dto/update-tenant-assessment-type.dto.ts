import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateTenantAssessmentTypeDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
