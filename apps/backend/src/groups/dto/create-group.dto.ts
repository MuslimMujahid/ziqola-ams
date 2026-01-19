import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";

import { GROUP_TYPES, type GroupTypeValue } from "./group-type";

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsEnum(GROUP_TYPES)
  type: GroupTypeValue;
}
