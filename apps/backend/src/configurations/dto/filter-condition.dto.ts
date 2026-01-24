import { IsDefined, IsString } from "class-validator";

export class FilterConditionDto {
  @IsString()
  fieldKey: string;

  @IsString()
  op: string;

  @IsDefined()
  value: unknown;
}
