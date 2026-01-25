import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { User as UserDecorator } from "../common/decorators/user.decorator";
import type { JwtPayload } from "./strategies/jwt.strategy";
import {
  Permission,
  Public,
  RequirePermissions,
  Role,
  Roles,
  successResponse,
} from "../common";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.USER_CREATE)
  @Post("register")
  async register(@Body() dto: RegisterDto, @UserDecorator() user: any) {
    if (user?.tenantId && user.tenantId !== dto.tenantId) {
      throw new ForbiddenException("Tenant access denied");
    }
    const result = await this.auth.register(dto, user);
    return successResponse(result, "Invite created successfully", 201);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post("accept-invite")
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    const result = await this.auth.acceptInvite(dto);
    return successResponse(result, "Invite accepted successfully", 200);
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const result = await this.auth.login(dto);
    return successResponse(result, "Login successful", 200);
  }

  @Get("me")
  async me(@UserDecorator() user: JwtPayload) {
    const profile = await this.auth.me(user);
    return successResponse(
      { user: profile },
      "User retrieved successfully",
      200,
    );
  }

  @Post("logout")
  @HttpCode(200)
  logout() {
    return successResponse(null, "Logout successful", 200);
  }
}
