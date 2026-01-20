import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@repo/db";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";
import { SubjectQueryDto } from "./dto/subject-query.dto";

export type SubjectSummary = {
  id: string;
  tenantId: string;
  name: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapSubject(subject: {
    id: string;
    tenantId: string;
    name: string;
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SubjectSummary {
    return {
      id: subject.id,
      tenantId: subject.tenantId,
      name: subject.name,
      isDeleted: subject.isDeleted,
      deletedAt: subject.deletedAt,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  }

  async getSubjects(tenantId: string, query: SubjectQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order: Prisma.SortOrder = query.order ?? "desc";

    const where: Prisma.SubjectWhereInput = {
      tenantId,
      isDeleted: false,
      ...(query.search
        ? {
            name: {
              contains: query.search.trim(),
              mode: "insensitive",
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.subject.findMany({
        where,
        orderBy: { createdAt: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          name: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.client.subject.count({ where }),
    ]);

    return {
      data: items.map((item) => this.mapSubject(item)),
      total,
    };
  }

  async createSubject(tenantId: string, dto: CreateSubjectDto) {
    const name = dto.name.trim();

    const existing = await this.prisma.client.subject.findFirst({
      where: { tenantId, name },
      select: {
        id: true,
        isDeleted: true,
      },
    });

    if (existing && !existing.isDeleted) {
      throw new ConflictException("Subject name already exists");
    }

    if (existing && existing.isDeleted) {
      const restored = await this.prisma.client.subject.update({
        where: { id: existing.id },
        data: { isDeleted: false, deletedAt: null, name },
        select: {
          id: true,
          tenantId: true,
          name: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return this.mapSubject(restored);
    }

    const created = await this.prisma.client.subject.create({
      data: {
        tenantId,
        name,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapSubject(created);
  }

  async updateSubject(tenantId: string, id: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.client.subject.findFirst({
      where: { id, tenantId, isDeleted: false },
      select: {
        id: true,
        tenantId: true,
        name: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    const nextName = dto.name?.trim();

    if (nextName && nextName !== subject.name) {
      const conflict = await this.prisma.client.subject.findFirst({
        where: {
          tenantId,
          name: nextName,
          isDeleted: false,
          id: { not: id },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new ConflictException("Subject name already exists");
      }
    }

    if (!nextName) {
      return this.mapSubject(subject);
    }

    const updated = await this.prisma.client.subject.update({
      where: { id },
      data: { name: nextName },
      select: {
        id: true,
        tenantId: true,
        name: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapSubject(updated);
  }

  async deleteSubject(tenantId: string, id: string) {
    const subject = await this.prisma.client.subject.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        isDeleted: true,
        _count: { select: { classSubjects: true } },
      },
    });

    if (!subject || subject.isDeleted) {
      throw new NotFoundException("Subject not found");
    }

    const hasAssignments = (subject._count?.classSubjects ?? 0) > 0;

    if (hasAssignments) {
      const softDeleted = await this.prisma.client.subject.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
        select: {
          id: true,
          tenantId: true,
          name: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return { ...this.mapSubject(softDeleted), deleted: "soft" as const };
    }

    const deleted = await this.prisma.client.subject.delete({
      where: { id },
      select: { id: true, name: true },
    });

    return { ...deleted, deleted: "hard" as const };
  }
}
