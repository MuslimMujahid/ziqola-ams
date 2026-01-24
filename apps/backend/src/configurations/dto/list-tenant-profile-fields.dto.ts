import { IsIn, IsOptional, IsString } from "class-validator";
import { PROFILE_ROLES } from "../configurations.constants";

export class ListTenantProfileFieldsDto {
  @IsOptional()
  @IsString()
  @IsIn(PROFILE_ROLES)
  role?: string;
}
