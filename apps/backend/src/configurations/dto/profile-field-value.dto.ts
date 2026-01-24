import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class ProfileFieldValueDto {
  @IsString()
  fieldId: string;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @IsOptional()
  @IsDateString()
  valueDate?: string;

  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  @IsOptional()
  @IsString()
  valueSelect?: string;

  @IsOptional()
  @IsArray()
  valueMultiSelect?: string[];

  @IsOptional()
  @IsObject()
  valueFile?: Record<string, unknown>;
}
