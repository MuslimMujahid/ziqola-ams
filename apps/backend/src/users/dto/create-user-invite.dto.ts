import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Role } from "@repo/db";

export class CreateUserInviteDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  role: Role;
}
