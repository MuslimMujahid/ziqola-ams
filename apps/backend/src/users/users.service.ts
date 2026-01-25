import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { ConfigService } from "@nestjs/config";
import crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { ListUsersDto } from "./dto/list-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserInviteDto } from "./dto/create-user-invite.dto";
import { BulkCreateUsersDto } from "./dto/bulk-create-users.dto";
import { EmailService } from "../common/email/email.service";

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "name", "email", "role"]);
const INVITE_EXPIRY_HOURS = 72;
const RESEND_COOLDOWN_MINUTES = 15;
const STATUS_INVITED = "INVITED";
const STATUS_ACTIVE = "ACTIVE";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async findAll(tenantId: string, query: ListUsersDto) {
    const sortField = ALLOWED_SORT_FIELDS.has(query.sort ?? "")
      ? (query.sort as "createdAt" | "name" | "email" | "role")
      : "createdAt";
    const order = query.order ?? "desc";

    const whereClause = {
      tenantId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const users = await this.prisma.client.user.findMany({
      where: whereClause,
      orderBy: { [sortField]: order },
      skip: query.offset ?? 0,
      take: query.limit ?? 10,
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        teacherProfile: {
          select: {
            id: true,
            hiredAt: true,
            additionalIdentifiers: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            additionalIdentifiers: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
    options: { allowRoleChange: boolean },
  ) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true, email: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.prisma.client.user.findFirst({
        where: { tenantId, email: dto.email },
        select: { id: true },
      });
      if (emailExists) {
        throw new ConflictException("Email already in use");
      }
    }

    if (dto.role && !options.allowRoleChange) {
      throw new BadRequestException("Cannot change own role");
    }

    return this.prisma.client.user.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.email ? { email: dto.email } : {}),
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.gender ? { gender: dto.gender } : {}),
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
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
        updatedAt: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.client.user.delete({ where: { id } });
  }

  async resetPassword(tenantId: string, id: string, newPassword: string) {
    const existing = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.client.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async changePassword(
    tenantId: string,
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, tenantId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new UnauthorizedException("Current password incorrect");
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.client.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async createInviteUser(
    tenantId: string,
    dto: CreateUserInviteDto,
    invitedBy: { sub: string; email: string },
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.client.user.findFirst({
      where: { tenantId, email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("Email already registered for this tenant");
    }

    const { token, tokenHash, expiresAt } = this.createInviteToken();
    const passwordHash = await argon2.hash(this.createRandomPassword());
    const now = new Date();

    const user = await this.prisma.client.user.create({
      data: {
        tenantId,
        email: normalizedEmail,
        name: dto.name,
        passwordHash,
        role: dto.role,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        phoneNumber: dto.phoneNumber,
        status: STATUS_INVITED,
        inviteTokenHash: tokenHash,
        inviteExpiresAt: expiresAt,
        invitedAt: now,
        lastInviteSentAt: now,
        inviteSentCount: 1,
        invitedById: invitedBy.sub,
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
        status: true,
        createdAt: true,
      },
    });

    await this.sendInviteEmail({
      email: user.email,
      name: user.name,
      token,
    });

    return { user };
  }

  async bulkCreateInvites(
    tenantId: string,
    dto: BulkCreateUsersDto,
    invitedBy: { sub: string; email: string },
  ) {
    const payload = dto.users ?? [];
    if (payload.length === 0) {
      throw new BadRequestException("No users provided");
    }

    const emailCounts = payload.reduce<Record<string, number>>((acc, item) => {
      const email = item.email.trim().toLowerCase();
      acc[email] = (acc[email] ?? 0) + 1;
      return acc;
    }, {});

    const emails = Object.keys(emailCounts);
    const existing = await this.prisma.client.user.findMany({
      where: { tenantId, email: { in: emails } },
      select: { email: true },
    });
    const existingSet = new Set(existing.map((item) => item.email));

    const created: Array<{ id: string; email: string; name: string }> = [];
    const failed: Array<{ email: string; reason: string }> = [];

    for (const item of payload) {
      const normalizedEmail = item.email.trim().toLowerCase();
      if (emailCounts[normalizedEmail] > 1) {
        failed.push({
          email: item.email,
          reason: "Duplicate email in payload",
        });
        continue;
      }

      if (existingSet.has(normalizedEmail)) {
        failed.push({
          email: item.email,
          reason: "Email already registered",
        });
        continue;
      }

      try {
        const result = await this.createInviteUser(tenantId, item, invitedBy);
        created.push({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name ?? "",
        });
      } catch (error) {
        failed.push({
          email: item.email,
          reason:
            error instanceof Error ? error.message : "Failed to create invite",
        });
      }
    }

    return {
      created,
      failed,
      total: payload.length,
    };
  }

  async resendInvite(
    tenantId: string,
    userId: string,
    invitedBy: { sub: string; email: string },
  ) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        invitedAt: true,
        inviteExpiresAt: true,
        lastInviteSentAt: true,
        inviteSentCount: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status === STATUS_ACTIVE) {
      throw new BadRequestException("User is already active");
    }

    if (user.lastInviteSentAt) {
      const diffMs = Date.now() - user.lastInviteSentAt.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      if (diffMinutes < RESEND_COOLDOWN_MINUTES) {
        throw new HttpException(
          "Invite resend is rate-limited. Please wait before retrying.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const { token, tokenHash, expiresAt } = this.createInviteToken();
    const now = new Date();

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        inviteTokenHash: tokenHash,
        inviteExpiresAt: expiresAt,
        invitedAt: user.invitedAt ?? now,
        lastInviteSentAt: now,
        inviteSentCount: (user.inviteSentCount ?? 0) + 1,
        invitedById: invitedBy.sub,
        status: STATUS_INVITED,
      },
    });

    await this.sendInviteEmail({
      email: user.email,
      name: user.name ?? "Pengguna",
      token,
    });

    return { userId: user.id, email: user.email };
  }

  private createInviteToken() {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    return { token, tokenHash, expiresAt };
  }

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private createRandomPassword() {
    return crypto.randomBytes(16).toString("base64url");
  }

  private async sendInviteEmail(params: {
    email: string;
    name: string;
    token: string;
  }) {
    const baseUrl = this.config.get<string>("WEB_APP_URL");
    if (!baseUrl) {
      throw new BadRequestException("WEB_APP_URL is not configured");
    }

    const inviteUrl = `${baseUrl.replace(/\/$/, "")}/auth/accept-invite?token=${encodeURIComponent(
      params.token,
    )}`;

    await this.email.sendInviteEmail({
      to: params.email,
      name: params.name,
      inviteUrl,
      expiresInHours: INVITE_EXPIRY_HOURS,
    });
  }
}
