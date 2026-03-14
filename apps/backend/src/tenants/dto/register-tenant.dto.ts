import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const EDUCATION_LEVEL_VALUES = ["SD", "SMP", "SMA", "SMK", "OTHER"] as const;

export type EducationLevel = (typeof EDUCATION_LEVEL_VALUES)[number];

export class RegisterTenantAdminDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  schoolName: string;

  @IsIn(EDUCATION_LEVEL_VALUES)
  educationLevel: EducationLevel;

  @ValidateNested()
  @Type(() => RegisterTenantAdminDto)
  admin: RegisterTenantAdminDto;
}
