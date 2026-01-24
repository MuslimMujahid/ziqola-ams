import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { ListUsersDto } from "./dto/list-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "name", "email", "role"]);

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
