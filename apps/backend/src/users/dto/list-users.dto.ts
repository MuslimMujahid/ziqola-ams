import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../common";
import { Role } from "@repo/db";

export class ListUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  search?: string;
}
