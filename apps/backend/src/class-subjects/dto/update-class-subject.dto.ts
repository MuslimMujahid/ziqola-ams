import { IsUUID } from "class-validator";

export class UpdateClassSubjectDto {
  @IsUUID()
  teacherProfileId: string;
}
