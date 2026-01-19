import { IsDateString, IsOptional } from "class-validator";

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
