import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  PROFILE_FIELD_TYPES,
  PROFILE_ROLES,
} from "../configurations.constants";
import { ProfileFieldOptionDto } from "./profile-field-option.dto.js";

export class CreateTenantProfileFieldDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsString()
  @IsIn(PROFILE_FIELD_TYPES)
  type: string;

  @IsString()
  @IsIn(PROFILE_ROLES)
  role: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileFieldOptionDto)
  options?: ProfileFieldOptionDto[];

  @IsOptional()
  @IsObject()
  validation?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  order?: number;
}
