import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@repo/db";

import { PrismaService } from "../prisma/prisma.service";
import { ClassSubjectQueryDto } from "./dto/class-subject-query.dto";
import { CreateClassSubjectDto } from "./dto/create-class-subject.dto";
import { UpdateClassSubjectDto } from "./dto/update-class-subject.dto";

export type ClassSubjectSummary = {
  id: string;
  tenantId: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearLabel: string;
  subjectId: string;
  subjectName: string;
  teacherProfileId: string;
  teacherUserId: string;
  teacherName: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
};

@Injectable()
export class ClassSubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapClassSubject(item: {
    id: string;
    tenantId: string;
    classId: string;
    class: { id: string; name: string };
    academicYearId: string;
    academicYear: { id: string; label: string };
    subjectId: string;
    subject: { id: string; name: string };
    teacherProfileId: string;
    teacherProfile: { id: string; user: { id: string; name: string } };
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ClassSubjectSummary {
    return {
      id: item.id,
      tenantId: item.tenantId,
      classId: item.classId,
      className: item.class.name,
      academicYearId: item.academicYearId,
      academicYearLabel: item.academicYear.label,
      subjectId: item.subjectId,
      subjectName: item.subject.name,
      teacherProfileId: item.teacherProfileId,
      teacherUserId: item.teacherProfile.user.id,
      teacherName: item.teacherProfile.user.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isDeleted: item.isDeleted,
      deletedAt: item.deletedAt,
    };
  }

  private async validateTeacherProfile(tenantId: string, id: string) {
    const teacherProfile = await this.prisma.client.teacherProfile.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });

    if (!teacherProfile) {
      throw new NotFoundException("Teacher not found");
    }

    if (teacherProfile.user.role !== Role.TEACHER) {
      throw new BadRequestException("User is not a teacher");
    }

    return teacherProfile;
  }

  async getClassSubjects(tenantId: string, query: ClassSubjectQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order = query.order ?? "desc";

    const where = {
      tenantId,
      isDeleted: false,
      ...(query.academicYearId ? { academicYearId: query.academicYearId } : {}),
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.teacherProfileId
        ? { teacherProfileId: query.teacherProfileId }
        : {}),
    };

    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.classSubject.findMany({
        where,
        orderBy: { createdAt: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          classId: true,
          class: { select: { id: true, name: true } },
          academicYearId: true,
          academicYear: { select: { id: true, label: true } },
          subjectId: true,
          subject: { select: { id: true, name: true } },
          teacherProfileId: true,
          teacherProfile: {
            select: { id: true, user: { select: { id: true, name: true } } },
          },
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.client.classSubject.count({ where }),
    ]);

    return {
      data: items.map((item) => this.mapClassSubject(item)),
      total,
    };
  }

  async createClassSubject(tenantId: string, dto: CreateClassSubjectDto) {
    const [classItem, subject, academicYear, teacherProfile] =
      await Promise.all([
        this.prisma.client.class.findFirst({
          where: { id: dto.classId, tenantId },
          select: {
            id: true,
            tenantId: true,
            academicYearId: true,
            name: true,
          },
        }),
        this.prisma.client.subject.findFirst({
          where: { id: dto.subjectId, tenantId },
          select: { id: true, tenantId: true, name: true, isDeleted: true },
        }),
        this.prisma.client.academicYear.findFirst({
          where: { id: dto.academicYearId, tenantId },
          select: { id: true, label: true },
        }),
        this.validateTeacherProfile(tenantId, dto.teacherProfileId),
      ]);

    if (!classItem) {
      throw new NotFoundException("Class not found");
    }

    if (!academicYear) {
      throw new NotFoundException("Academic year not found");
    }

    if (classItem.academicYearId !== dto.academicYearId) {
      throw new BadRequestException(
        "Class does not belong to this academic year",
      );
    }

    if (!subject || subject.isDeleted) {
      throw new NotFoundException("Subject not found");
    }

    const existing = await this.prisma.client.classSubject.findFirst({
      where: {
        tenantId,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
        subjectId: dto.subjectId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("Class already has this subject assignment");
    }

    const softDeleted = await this.prisma.client.classSubject.findFirst({
      where: {
        tenantId,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
        subjectId: dto.subjectId,
        isDeleted: true,
      },
      select: { id: true },
    });

    if (softDeleted) {
      const restored = await this.prisma.client.classSubject.update({
        where: { id: softDeleted.id },
        data: {
          teacherProfileId: dto.teacherProfileId,
          isDeleted: false,
          deletedAt: null,
        },
        select: {
          id: true,
          tenantId: true,
          classId: true,
          class: { select: { id: true, name: true } },
          academicYearId: true,
          academicYear: { select: { id: true, label: true } },
          subjectId: true,
          subject: { select: { id: true, name: true } },
          teacherProfileId: true,
          teacherProfile: {
            select: { id: true, user: { select: { id: true, name: true } } },
          },
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return this.mapClassSubject(restored);
    }

    const created = await this.prisma.client.classSubject.create({
      data: {
        tenantId,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
        subjectId: dto.subjectId,
        teacherProfileId: dto.teacherProfileId,
      },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicYearId: true,
        academicYear: { select: { id: true, label: true } },
        subjectId: true,
        subject: { select: { id: true, name: true } },
        teacherProfileId: true,
        teacherProfile: {
          select: { id: true, user: { select: { id: true, name: true } } },
        },
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapClassSubject(created);
  }

  async updateClassSubject(
    tenantId: string,
    id: string,
    dto: UpdateClassSubjectDto,
  ) {
    const classSubject = await this.prisma.client.classSubject.findFirst({
      where: { id, tenantId, isDeleted: false },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicYearId: true,
        academicYear: { select: { id: true, label: true } },
        subjectId: true,
        subject: { select: { id: true, name: true } },
        teacherProfileId: true,
        teacherProfile: {
          select: { id: true, user: { select: { id: true, name: true } } },
        },
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!classSubject) {
      throw new NotFoundException("Class subject not found");
    }

    await this.validateTeacherProfile(tenantId, dto.teacherProfileId);

    const updated = await this.prisma.client.classSubject.update({
      where: { id },
      data: { teacherProfileId: dto.teacherProfileId },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicYearId: true,
        academicYear: { select: { id: true, label: true } },
        subjectId: true,
        subject: { select: { id: true, name: true } },
        teacherProfileId: true,
        teacherProfile: {
          select: { id: true, user: { select: { id: true, name: true } } },
        },
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapClassSubject(updated);
  }

  async deleteClassSubject(tenantId: string, id: string) {
    const classSubject = await this.prisma.client.classSubject.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        isDeleted: true,
      },
    });

    if (!classSubject || classSubject.isDeleted) {
      throw new NotFoundException("Class subject not found");
    }

    const softDeleted = await this.prisma.client.classSubject.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicYearId: true,
        academicYear: { select: { id: true, label: true } },
        subjectId: true,
        subject: { select: { id: true, name: true } },
        teacherProfileId: true,
        teacherProfile: {
          select: { id: true, user: { select: { id: true, name: true } } },
        },
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { ...this.mapClassSubject(softDeleted), deleted: "soft" as const };
  }
}
