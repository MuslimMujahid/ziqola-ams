import { IsOptional, IsString, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../common";

export class ListTeacherProfilesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
