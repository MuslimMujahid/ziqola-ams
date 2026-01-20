import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class GenerateSessionsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  windowDays?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
