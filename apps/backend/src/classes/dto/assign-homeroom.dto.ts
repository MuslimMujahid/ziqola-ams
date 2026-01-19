import { IsUUID } from "class-validator";

export class AssignHomeroomDto {
  @IsUUID()
  teacherProfileId: string;
}
