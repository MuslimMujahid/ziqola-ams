import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../common";
import { GROUP_TYPES, type GroupTypeValue } from "./group-type";

export class GroupQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(GROUP_TYPES)
  type?: GroupTypeValue;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
