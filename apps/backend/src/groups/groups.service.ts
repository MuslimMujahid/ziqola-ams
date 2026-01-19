import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GroupType, type Prisma } from "@repo/db";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { GroupQueryDto } from "./dto/group-query.dto";

type GroupSummary = {
  id: string;
  tenantId: string;
  name: string;
  type: GroupType;
  createdAt: Date;
  updatedAt: Date;
  classCount: number;
};

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureUserManagedType(type: GroupType) {
    if (type === GroupType.GRADE) {
      throw new BadRequestException("GRADE groups are managed by the system");
    }
  }

  private mapGroup(group: {
    id: string;
    tenantId: string;
    name: string;
    type: GroupType;
    createdAt: Date;
    updatedAt: Date;
    _count?: { classGroups: number };
  }): GroupSummary {
    return {
      id: group.id,
      tenantId: group.tenantId,
      name: group.name,
      type: group.type,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      classCount: group._count?.classGroups ?? 0,
    };
  }

  async getGroups(tenantId: string, query: GroupQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order = query.order ?? "desc";

    const where: Prisma.GroupWhereInput = { tenantId };

    if (query.type) {
      where.type = query.type as GroupType;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.group.findMany({
        where,
        orderBy: { createdAt: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          name: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { classGroups: true } },
        },
      }),
      this.prisma.client.group.count({ where }),
    ]);

    return {
      data: data.map((group) => this.mapGroup(group)),
      total,
    };
  }

  async createGroup(tenantId: string, dto: CreateGroupDto) {
    const groupType = dto.type as GroupType;
    this.ensureUserManagedType(groupType);

    const existing = await this.prisma.client.group.findFirst({
      where: { tenantId, name: dto.name, type: groupType },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("Group name already exists for this type");
    }

    const created = await this.prisma.client.group.create({
      data: {
        tenantId,
        name: dto.name,
        type: groupType,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { classGroups: true } },
      },
    });

    return this.mapGroup(created);
  }

  async updateGroup(tenantId: string, id: string, dto: UpdateGroupDto) {
    const existing = await this.prisma.client.group.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { classGroups: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException("Group not found");
    }

    if (existing.type === GroupType.GRADE) {
      throw new BadRequestException("GRADE groups are managed by the system");
    }

    if (dto.type) {
      this.ensureUserManagedType(dto.type as GroupType);
    }

    const nextName = dto.name ?? existing.name;
    const nextType = (dto.type ?? existing.type) as GroupType;

    const nameConflict = await this.prisma.client.group.findFirst({
      where: {
        tenantId,
        name: nextName,
        type: nextType,
        id: { not: id },
      },
      select: { id: true },
    });

    if (nameConflict) {
      throw new ConflictException("Group name already exists for this type");
    }

    const updateData: Prisma.GroupUncheckedUpdateInput = {};

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.type) {
      updateData.type = dto.type as GroupType;
    }

    if (Object.keys(updateData).length === 0) {
      return this.mapGroup(existing);
    }

    const updated = await this.prisma.client.group.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { classGroups: true } },
      },
    });

    return this.mapGroup(updated);
  }

  async deleteGroup(tenantId: string, id: string) {
    const existing = await this.prisma.client.group.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { classGroups: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException("Group not found");
    }

    if (existing.type === GroupType.GRADE) {
      throw new BadRequestException("GRADE groups cannot be deleted");
    }

    if ((existing._count?.classGroups ?? 0) > 0) {
      throw new BadRequestException(
        "Group cannot be deleted while assigned to classes",
      );
    }

    const deleted = await this.prisma.client.group.delete({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { classGroups: true } },
      },
    });

    return this.mapGroup(deleted);
  }
}
