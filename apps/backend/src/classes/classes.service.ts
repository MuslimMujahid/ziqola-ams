import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ClassQueryDto } from "./dto/class-query.dto";
import { CreateClassDto } from "./dto/create-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { AssignHomeroomDto } from "./dto/assign-homeroom.dto";
import { GroupType, Role, type Prisma } from "@repo/db";

type GroupSummary = {
  id: string;
  name: string;
  type: GroupType;
};

type HomeroomTeacherSummary = {
  assignmentId: string;
  teacherProfileId: string;
  userId: string;
  name: string;
  assignedAt: Date;
};

type ClassSummary = {
  id: string;
  tenantId: string;
  name: string;
  academicYearId: string;
  academicYear: { id: string; label: string } | null;
  groups: GroupSummary[];
  homeroomTeacher: HomeroomTeacherSummary | null;
  createdAt: Date;
  updatedAt: Date;
};

type ClassDeleteResult = {
  id: string;
  name: string;
};

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapClass(classItem: {
    id: string;
    tenantId: string;
    name: string;
    academicYearId: string;
    academicYear: { id: string; label: string } | null;
    classGroups: { group: { id: string; name: string; type: GroupType } }[];
    homeroomAssignments: {
      id: string;
      teacherProfileId: string;
      assignedAt: Date;
      teacherProfile: { id: string; user: { id: string; name: string } };
    }[];
    createdAt: Date;
    updatedAt: Date;
  }): ClassSummary {
    const homeroom = classItem.homeroomAssignments[0];

    return {
      id: classItem.id,
      tenantId: classItem.tenantId,
      name: classItem.name,
      academicYearId: classItem.academicYearId,
      academicYear: classItem.academicYear,
      groups: classItem.classGroups.map((classGroup) => classGroup.group),
      homeroomTeacher: homeroom
        ? {
            assignmentId: homeroom.id,
            teacherProfileId: homeroom.teacherProfileId,
            userId: homeroom.teacherProfile.user.id,
            name: homeroom.teacherProfile.user.name,
            assignedAt: homeroom.assignedAt,
          }
        : null,
      createdAt: classItem.createdAt,
      updatedAt: classItem.updatedAt,
    };
  }

  private async resolveAcademicYearId(
    tenantId: string,
    academicYearId?: string,
  ) {
    if (academicYearId) {
      return academicYearId;
    }

    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id: tenantId },
      select: { activeAcademicYearId: true },
    });

    if (!tenant?.activeAcademicYearId) {
      return null;
    }

    return tenant.activeAcademicYearId;
  }

  private async ensureAcademicYearExists(
    tenantId: string,
    academicYearId: string,
  ) {
    const academicYear = await this.prisma.client.academicYear.findFirst({
      where: { id: academicYearId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!academicYear) {
      throw new NotFoundException("Academic year not found");
    }
  }

  private async resolveGroupIds(tenantId: string, groupIds?: string[]) {
    if (!groupIds) {
      return undefined;
    }

    const uniqueIds = Array.from(new Set(groupIds));

    if (uniqueIds.length === 0) {
      return { ids: [], groups: [] };
    }

    const groups = await this.prisma.client.group.findMany({
      where: { tenantId, id: { in: uniqueIds } },
      select: { id: true, type: true },
    });

    if (groups.length !== uniqueIds.length) {
      throw new NotFoundException("One or more groups not found");
    }

    this.validateGroupSelection(groups);

    return { ids: uniqueIds, groups };
  }

  private validateGroupSelection(
    groups: Array<{ id: string; type: GroupType }>,
  ) {
    if (groups.length > 2) {
      throw new BadRequestException(
        "Class can only have one grade group and one optional non-grade group",
      );
    }

    const gradeGroups = groups.filter(
      (group) => group.type === GroupType.GRADE,
    );
    const nonGradeGroups = groups.filter(
      (group) => group.type !== GroupType.GRADE,
    );

    if (gradeGroups.length > 1) {
      throw new BadRequestException("Only one grade group is allowed");
    }

    if (nonGradeGroups.length > 1) {
      throw new BadRequestException("Only one non-grade group is allowed");
    }

    if (nonGradeGroups.length === 0) {
      throw new BadRequestException("Non-grade group is required");
    }
  }

  private async getClassWithDetails(id: string, tenantId: string) {
    const classItem = await this.prisma.client.class.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        academicYearId: true,
        academicYear: { select: { id: true, label: true } },
        classGroups: {
          select: { group: { select: { id: true, name: true, type: true } } },
        },
        homeroomAssignments: {
          where: { isActive: true, endedAt: null },
          orderBy: { assignedAt: "desc" },
          take: 1,
          select: {
            id: true,
            teacherProfileId: true,
            assignedAt: true,
            teacherProfile: {
              select: { id: true, user: { select: { id: true, name: true } } },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException("Class not found");
    }

    return this.mapClass(classItem);
  }

  async getClasses(tenantId: string, query: ClassQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order = query.order ?? "desc";

    const academicYearId = await this.resolveAcademicYearId(
      tenantId,
      query.academicYearId,
    );

    if (!academicYearId) {
      throw new BadRequestException(
        "Academic year is required to list classes",
      );
    }

    await this.ensureAcademicYearExists(tenantId, academicYearId);

    const where: Prisma.ClassWhereInput = {
      tenantId,
      academicYearId,
    };

    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    if (query.groupId) {
      where.classGroups = { some: { groupId: query.groupId } };
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.class.findMany({
        where,
        orderBy: { createdAt: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          name: true,
          academicYearId: true,
          academicYear: { select: { id: true, label: true } },
          classGroups: {
            select: { group: { select: { id: true, name: true, type: true } } },
          },
          homeroomAssignments: {
            where: { isActive: true, endedAt: null },
            orderBy: { assignedAt: "desc" },
            take: 1,
            select: {
              id: true,
              teacherProfileId: true,
              assignedAt: true,
              teacherProfile: {
                select: {
                  id: true,
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.client.class.count({ where }),
    ]);

    return {
      data: data.map((classItem) => this.mapClass(classItem)),
      total,
    };
  }

  async createClass(tenantId: string, dto: CreateClassDto) {
    await this.ensureAcademicYearExists(tenantId, dto.academicYearId);

    const existing = await this.prisma.client.class.findFirst({
      where: {
        tenantId,
        academicYearId: dto.academicYearId,
        name: dto.name,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException("Class name already exists for this year");
    }

    const groupSelection = await this.resolveGroupIds(tenantId, dto.groupIds);

    const created = await this.prisma.client.$transaction(async (tx) => {
      const classItem = await tx.class.create({
        data: {
          tenantId,
          academicYearId: dto.academicYearId,
          name: dto.name,
        },
        select: { id: true },
      });

      if (groupSelection && groupSelection.ids.length > 0) {
        await tx.classGroup.createMany({
          data: groupSelection.ids.map((groupId) => ({
            tenantId,
            classId: classItem.id,
            groupId,
          })),
        });
      }

      return classItem.id;
    });

    return this.getClassWithDetails(created, tenantId);
  }

  async updateClass(tenantId: string, id: string, dto: UpdateClassDto) {
    const existing = await this.prisma.client.class.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, academicYearId: true },
    });

    if (!existing) {
      throw new NotFoundException("Class not found");
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.client.class.findFirst({
        where: {
          tenantId,
          academicYearId: existing.academicYearId,
          name: dto.name,
          id: { not: id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException("Class name already exists for this year");
      }
    }

    const groupSelection = await this.resolveGroupIds(tenantId, dto.groupIds);

    await this.prisma.client.$transaction(async (tx) => {
      const updateData: Prisma.ClassUncheckedUpdateInput = {};

      if (dto.name) {
        updateData.name = dto.name;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.class.update({
          where: { id },
          data: updateData,
          select: { id: true },
        });
      }

      if (groupSelection) {
        await tx.classGroup.deleteMany({ where: { classId: id } });

        if (groupSelection.ids.length > 0) {
          await tx.classGroup.createMany({
            data: groupSelection.ids.map((groupId) => ({
              tenantId,
              classId: id,
              groupId,
            })),
          });
        }
      }
    });

    return this.getClassWithDetails(id, tenantId);
  }

  async assignHomeroom(tenantId: string, id: string, dto: AssignHomeroomDto) {
    const classItem = await this.prisma.client.class.findFirst({
      where: { id, tenantId },
      select: { id: true, academicYearId: true },
    });

    if (!classItem) {
      throw new NotFoundException("Class not found");
    }

    const teacherProfile = await this.prisma.client.teacherProfile.findFirst({
      where: { id: dto.teacherProfileId, tenantId },
      select: {
        id: true,
        user: { select: { id: true, name: true, role: true } },
      },
    });

    if (!teacherProfile) {
      throw new NotFoundException("Teacher profile not found");
    }

    if (teacherProfile.user.role !== Role.TEACHER) {
      throw new BadRequestException("Selected user is not a teacher");
    }

    const existingAssignment =
      await this.prisma.client.homeroomAssignment.findFirst({
        where: {
          tenantId,
          classId: id,
          academicYearId: classItem.academicYearId,
          teacherProfileId: dto.teacherProfileId,
          isActive: true,
          endedAt: null,
        },
        select: {
          id: true,
          teacherProfileId: true,
          assignedAt: true,
        },
      });

    if (existingAssignment) {
      return {
        assignmentId: existingAssignment.id,
        teacherProfileId: existingAssignment.teacherProfileId,
        userId: teacherProfile.user.id,
        name: teacherProfile.user.name,
        assignedAt: existingAssignment.assignedAt,
      };
    }

    const assignment = await this.prisma.client.$transaction(async (tx) => {
      await tx.homeroomAssignment.updateMany({
        where: {
          tenantId,
          classId: id,
          academicYearId: classItem.academicYearId,
          isActive: true,
          endedAt: null,
        },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });

      return tx.homeroomAssignment.create({
        data: {
          tenantId,
          classId: id,
          academicYearId: classItem.academicYearId,
          teacherProfileId: dto.teacherProfileId,
        },
        select: {
          id: true,
          teacherProfileId: true,
          assignedAt: true,
        },
      });
    });

    return {
      assignmentId: assignment.id,
      teacherProfileId: assignment.teacherProfileId,
      userId: teacherProfile.user.id,
      name: teacherProfile.user.name,
      assignedAt: assignment.assignedAt,
    };
  }

  async deleteClass(tenantId: string, id: string): Promise<ClassDeleteResult> {
    const existing = await this.prisma.client.class.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            enrollments: true,
            classSubjects: true,
            schedules: true,
            sessions: true,
            reportCards: true,
            homeroomAssignments: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Class not found");
    }

    const dependencyCount =
      existing._count.enrollments +
      existing._count.classSubjects +
      existing._count.schedules +
      existing._count.sessions +
      existing._count.reportCards +
      existing._count.homeroomAssignments;

    if (dependencyCount > 0) {
      throw new BadRequestException(
        "Class cannot be deleted because it already has academic data",
      );
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.classGroup.deleteMany({ where: { classId: id } });
      await tx.class.delete({ where: { id } });
    });

    return { id: existing.id, name: existing.name };
  }
}
