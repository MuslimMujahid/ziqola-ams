import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { Gender } from "@repo/db";

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  nis?: string;

  @IsOptional()
  @IsString()
  nisn?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
