import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class ListTenantAssessmentTypesDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDisabled?: boolean;
}
