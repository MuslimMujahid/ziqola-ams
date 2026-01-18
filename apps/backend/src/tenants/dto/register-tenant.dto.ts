import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const SCHOOL_CODE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
  @MinLength(3)
  @MaxLength(50)
  @Matches(SCHOOL_CODE_REGEX, {
    message: "schoolCode must be lowercase, alphanumeric, and hyphen-separated",
  })
  schoolCode: string;

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
