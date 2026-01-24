import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PROFILE_FIELD_TYPES } from "../configurations.constants";
import { ProfileFieldOptionDto } from "./profile-field-option.dto";

export class UpdateTenantProfileFieldDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  @IsIn(PROFILE_FIELD_TYPES)
  type?: string;

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

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
