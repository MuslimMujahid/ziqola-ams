import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class UpdateClassSubjectDto {
  @IsUUID()
  teacherProfileId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  kkm?: number;
}
