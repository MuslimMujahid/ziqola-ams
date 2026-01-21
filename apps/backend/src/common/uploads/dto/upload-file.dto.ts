import { Type } from "class-transformer";
import {
  IsString,
  IsInt,
  IsIn,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  IsArray,
} from "class-validator";
import {
  FILE_VALIDATION,
  type AllowedMimeType,
} from "../file-validation.constants";

export class UploadFileDto {
  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @IsIn(FILE_VALIDATION.ALLOWED_MIME_TYPES)
  mimeType: AllowedMimeType;

  @IsInt()
  @Min(1)
  @Max(FILE_VALIDATION.MAX_SIZE)
  size: number;
}

export class UploadFilesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadFileDto)
  files: UploadFileDto[];
}
