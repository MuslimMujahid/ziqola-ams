import { Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from "class-validator";

export class AttachmentMetadataDto {
  @IsString()
  fileKey: string;

  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(1)
  size: number;
}

export class CreateSessionMaterialDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  links?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentMetadataDto)
  attachments?: AttachmentMetadataDto[];
}
