import { ArrayNotEmpty, IsArray, IsIn, IsString } from "class-validator";
import { TenantConfigurationType } from "@repo/db";

const CONFIGURATION_TYPES = [TenantConfigurationType.PROFILE] as const;

export class BatchConfigurationsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(CONFIGURATION_TYPES, { each: true })
  types!: Array<(typeof CONFIGURATION_TYPES)[number]>;
}
