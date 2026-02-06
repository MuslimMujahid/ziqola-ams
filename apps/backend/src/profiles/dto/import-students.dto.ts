import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class ImportStudentsRowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  className: string;

  @IsString()
  @IsNotEmpty()
  nisn: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}

export class ImportStudentsDto {
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  academicPeriodId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportStudentsRowDto)
  rows: ImportStudentsRowDto[];
}
