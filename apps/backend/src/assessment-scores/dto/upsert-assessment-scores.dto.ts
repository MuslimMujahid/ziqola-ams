import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

class AssessmentScoreItemDto {
  @IsUUID()
  studentProfileId: string;

  @Transform(({ value }) => {
    if (value === null || value === "") return null;
    return Number(value);
  })
  @ValidateIf((_value, score) => score !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  score: number | null;
}

export class UpsertAssessmentScoresDto {
  @IsUUID()
  componentId: string;

  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => AssessmentScoreItemDto)
  items: AssessmentScoreItemDto[];
}
