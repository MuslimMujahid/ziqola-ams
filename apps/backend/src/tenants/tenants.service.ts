import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import {
  RegisterTenantDto,
  type EducationLevel,
} from "./dto/register-tenant.dto";
import { AuthService } from "../auth/auth.service";
import { GroupType, Role } from "@repo/db";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.client.tenant.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: dto.slug }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("Tenant name or slug already exists");
    }

    return this.prisma.client.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        ...(dto.educationLevel ? { educationLevel: dto.educationLevel } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        educationLevel: true,
        activeAcademicYearId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    if (tenantId !== id) {
      throw new ForbiddenException("Tenant access denied");
    }

    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        educationLevel: true,
        activeAcademicYearId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async update(tenantId: string, id: string, dto: UpdateTenantDto) {
    if (tenantId !== id) {
      throw new ForbiddenException("Tenant access denied");
    }

    const existing = await this.prisma.client.tenant.findFirst({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException("Tenant not found");
    }

    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.client.tenant.findFirst({
        where: { name: dto.name },
        select: { id: true },
      });

      if (nameExists) {
        throw new ConflictException("Tenant name already exists");
      }
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.client.tenant.findFirst({
        where: { slug: dto.slug },
        select: { id: true },
      });

      if (slugExists) {
        throw new ConflictException("Tenant slug already exists");
      }
    }

    return this.prisma.client.tenant.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.educationLevel ? { educationLevel: dto.educationLevel } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        educationLevel: true,
        activeAcademicYearId: true,
        updatedAt: true,
      },
    });
  }

  async checkSchoolCodeAvailability(schoolCode: string) {
    const normalized = schoolCode.trim().toLowerCase();
    const existing = await this.prisma.client.tenant.findFirst({
      where: { slug: normalized },
      select: { id: true },
    });

    return { available: !existing };
  }

  async checkEmailAvailability(email: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.client.user.findFirst({
      where: { email: normalized },
      select: { id: true },
    });

    return { available: !existing };
  }

  async registerTenant(dto: RegisterTenantDto) {
    const normalizedCode = dto.schoolName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await this.prisma.client.tenant.findFirst({
      where: {
        OR: [{ name: dto.schoolName }, { slug: normalizedCode }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("School name or generated slug already exists");
    }

    const normalizedEmail = dto.admin.email.trim().toLowerCase();
    const existingEmail = await this.prisma.client.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException("Admin email is already registered");
    }

    const passwordHash = await argon2.hash(dto.admin.password);

    const result = await this.prisma.client.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.schoolName,
          slug: normalizedCode,
          educationLevel: dto.educationLevel,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          educationLevel: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const gradeGroups = this.getGradeGroups(dto.educationLevel);

      if (gradeGroups.length > 0) {
        await tx.group.createMany({
          data: gradeGroups.map((name) => ({
            tenantId: tenant.id,
            name,
            type: GroupType.GRADE,
          })),
          skipDuplicates: true,
        });
      }

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: normalizedEmail,
          name: dto.admin.fullName,
          passwordHash,
          role: Role.ADMIN_STAFF,
        },
        select: {
          id: true,
          tenantId: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return { tenant, user };
    });

    const accessToken = await this.authService.signToken(
      result.user.id,
      result.user.tenantId,
      result.user.email,
      result.user.role,
    );

    return {
      tenant: result.tenant,
      user: result.user,
      accessToken,
    };
  }

  private getGradeGroups(educationLevel: EducationLevel): string[] {
    if (educationLevel === "SD") {
      return ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"];
    }

    if (educationLevel === "SMP") {
      return ["Kelas 7", "Kelas 8", "Kelas 9"];
    }

    if (educationLevel === "SMA" || educationLevel === "SMK") {
      return ["Kelas 10", "Kelas 11", "Kelas 12"];
    }

    return [];
  }
}
