import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const SCHOOL_CODE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CheckSchoolCodeQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(SCHOOL_CODE_REGEX, {
    message: "schoolCode must be lowercase, alphanumeric, and hyphen-separated",
  })
  schoolCode: string;
}
