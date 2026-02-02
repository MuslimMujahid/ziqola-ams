import { IsIn, IsOptional, IsString } from "class-validator";

const DECISION_VALUES = ["approved", "rejected"] as const;

type DecisionValue = (typeof DECISION_VALUES)[number];

export class DecideAssessmentRecapChangeDto {
  @IsIn(DECISION_VALUES)
  decision: DecisionValue;

  @IsOptional()
  @IsString()
  note?: string;
}
