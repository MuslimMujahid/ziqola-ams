import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./strategies/jwt.strategy";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id: dto.tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const existing = await this.prisma.client.user.findFirst({
      where: { tenantId: dto.tenantId, email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email already registered for this tenant");
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.client.user.create({
      data: {
        tenantId: dto.tenantId,
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        phoneNumber: dto.phoneNumber,
      },
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
      },
    });
    const token = await this.signToken(
      user.id,
      user.tenantId,
      user.email,
      user.role,
    );
    return { user, accessToken: token };
  }

  async login(dto: LoginDto) {
    const tenantId = await this.resolveTenantId(dto);
    const user = await this.prisma.client.user.findFirst({
      where: { tenantId, email: dto.email, role: dto.role },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

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
}
