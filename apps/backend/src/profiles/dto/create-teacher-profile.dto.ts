import {
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class CreateTeacherProfileDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  nip?: string;

  @IsOptional()
  @IsString()
  nuptk?: string;

  @IsOptional()
  @IsDateString()
  hiredAt?: string;

  @IsOptional()
  @IsObject()
  additionalIdentifiers?: Record<string, unknown>;
}
