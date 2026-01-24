import { Type } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

import { PaginationQueryDto } from "../../common";

export class ListStudentProfilesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  withoutClass?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeCustomFields?: boolean;
}
