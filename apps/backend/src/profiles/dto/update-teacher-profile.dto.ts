import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { Gender } from "@repo/db";

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsDateString()
  hiredAt?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
