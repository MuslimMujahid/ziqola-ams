import { AttendanceStatus } from "@repo/db";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class AttendanceRecordItemDto {
  @IsUUID()
  studentProfileId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RecordSessionAttendanceDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordItemDto)
  items: AttendanceRecordItemDto[];
}
