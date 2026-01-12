import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

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
      data: { name: dto.name, slug: dto.slug },
      select: {
        id: true,
        name: true,
        slug: true,
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
      },
      select: {
        id: true,
        name: true,
        slug: true,
        activeAcademicYearId: true,
        updatedAt: true,
      },
    });
  }
}
