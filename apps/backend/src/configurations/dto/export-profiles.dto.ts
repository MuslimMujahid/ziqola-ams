import {
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsBoolean,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { FilterConditionDto } from "./filter-condition.dto.js";

export class ExportProfilesPaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

export class ExportProfilesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  filters: FilterConditionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ExportProfilesPaginationDto)
  pagination?: ExportProfilesPaginationDto;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsBoolean()
  withoutClass?: boolean;

  @IsString()
  @IsIn(["csv", "xlsx"])
  format: string;
}
