import { IsEmail } from "class-validator";

export class CheckEmailQueryDto {
  @IsEmail({}, { message: "Format email tidak valid" })
  email: string;
}
