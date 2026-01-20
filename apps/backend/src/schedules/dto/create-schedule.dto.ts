import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class CreateScheduleDto {
  @IsUUID()
  academicPeriodId: string;

  @IsOptional()
  @IsUUID()
  classSubjectId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  teacherProfileId?: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
