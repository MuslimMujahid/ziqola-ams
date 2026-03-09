import { Role } from "@repo/db";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";

export class LoginDto {

  @IsString()
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
