import { IsObject, IsOptional, IsString } from "class-validator";

export class ApplyConfigurationDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
