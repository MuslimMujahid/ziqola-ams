import { IsUUID } from "class-validator";

export class ListAssessmentScoresDto {
  @IsUUID()
  componentId: string;
}
