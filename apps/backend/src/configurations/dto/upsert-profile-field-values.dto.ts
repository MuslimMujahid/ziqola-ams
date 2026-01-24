import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ProfileFieldValueDto } from "./profile-field-value.dto";

export class UpsertProfileFieldValuesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileFieldValueDto)
  values: ProfileFieldValueDto[];
}
