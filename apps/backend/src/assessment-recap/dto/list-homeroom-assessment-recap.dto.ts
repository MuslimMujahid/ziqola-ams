import { IsIn, IsOptional, IsUUID } from "class-validator";

const SUBMISSION_STATUS_VALUES = [
  "submitted",
  "returned",
  "resubmitted",
] as const;
const CHANGE_REQUEST_STATUS_VALUES = [
  "pending",
  "approved",
  "rejected",
] as const;

type SubmissionStatus = (typeof SUBMISSION_STATUS_VALUES)[number];
type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUS_VALUES)[number];

export class ListHomeroomAssessmentRecapDto {
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsIn(SUBMISSION_STATUS_VALUES)
  status?: SubmissionStatus;

  @IsOptional()
  @IsIn(CHANGE_REQUEST_STATUS_VALUES)
  changeRequestStatus?: ChangeRequestStatus;
}
