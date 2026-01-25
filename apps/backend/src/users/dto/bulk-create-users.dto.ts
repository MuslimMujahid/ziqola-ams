import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { CreateUserInviteDto } from "./create-user-invite.dto";

export class BulkCreateUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateUserInviteDto)
  users: CreateUserInviteDto[];
}
