import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./strategies/jwt.strategy";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { UsersService } from "../users/users.service";

const STATUS_ACTIVE = "ACTIVE";
const STATUS_INVITED = "INVITED";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async register(dto: RegisterDto, invitedBy: { sub: string; email: string }) {
    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id: dto.tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const { tenantId, ...invitePayload } = dto;
    const result = await this.users.createInviteUser(
      tenantId,
      invitePayload,
      invitedBy,
    );

    return result;
  }

  async login(dto: LoginDto) {
    const tenantId = await this.resolveTenantId(dto);
    const user = await this.prisma.client.user.findFirst({
      where: { tenantId, email: dto.email, role: dto.role },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        createdAt: true,
        passwordHash: true,
        status: true,
      },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (user.status !== STATUS_ACTIVE) {
      throw new UnauthorizedException("Account is not active");
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const token = await this.signToken(
      user.id,
      user.tenantId,
      user.email,
      user.role,
    );
    const safeUser = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    };
    return { user: safeUser, accessToken: token };
  }

  async me(payload: JwtPayload) {
    if (!payload?.sub || !payload?.tenantId) {
      throw new UnauthorizedException("Invalid session");
    }

    const user = await this.prisma.client.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid session");
    }

    return user;
  }

  async signToken(sub: string, tenantId: string, email: string, role: string) {
    return this.jwt.signAsync({ sub, tenantId, email, role });
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const tokenHash = this.hashToken(dto.token);
    const user = await this.prisma.client.user.findFirst({
      where: { inviteTokenHash: tokenHash },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        inviteExpiresAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invite token invalid");
    }

    if (user.status !== STATUS_INVITED) {
      throw new BadRequestException("Invite is no longer valid");
    }

    if (!user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
      throw new UnauthorizedException("Invite has expired");
    }

    const passwordHash = await argon2.hash(dto.password);
    const updated = await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: STATUS_ACTIVE,
        inviteTokenHash: null,
        inviteExpiresAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    return { user: updated };
  }

  private async resolveTenantId(dto: LoginDto): Promise<string> {
    if (dto.tenantId) {
      return dto.tenantId;
    }

    if (!dto.tenantSlug) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tenant = await this.prisma.client.tenant.findFirst({
      where: { slug: dto.tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      throw new UnauthorizedException("Tenant not found");
    }

    return tenant.id;
  }

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
