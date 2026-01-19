import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateClassDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsUUID()
  academicYearId: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  groupIds?: string[];
}
