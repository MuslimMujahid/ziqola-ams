import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class CreateEnrollmentDto {
  @IsUUID()
  studentProfileId: string;

  @IsUUID()
  classId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
