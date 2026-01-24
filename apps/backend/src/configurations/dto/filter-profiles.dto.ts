import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { FilterConditionDto } from "./filter-condition.dto";

export class FilterPaginationDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

export class FilterProfilesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  filters: FilterConditionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterPaginationDto)
  pagination?: FilterPaginationDto;

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

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeCustomFields?: boolean;
}
