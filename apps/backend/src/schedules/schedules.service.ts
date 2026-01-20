import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@repo/db";

import { PrismaService } from "../prisma/prisma.service";
import { ScheduleQueryDto } from "./dto/schedule-query.dto";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

export type ScheduleSummary = {
  id: string;
  tenantId: string;
  classId: string;
  className: string;
  academicPeriodId: string;
  academicPeriodName: string;
  classSubjectId: string;
  subjectId: string;
  subjectName: string;
  teacherProfileId: string;
  teacherName: string;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapSchedule(item: {
    id: string;
    tenantId: string;
    classId: string;
    class: { id: string; name: string };
    academicPeriodId: string;
    academicPeriod: { id: string; name: string; academicYearId: string };
    classSubjectId: string;
    classSubject: {
      id: string;
      subjectId: string;
      subject: { id: string; name: string };
      teacherProfileId: string;
      teacherProfile: { id: string; user: { id: string; name: string } };
    };
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ScheduleSummary {
    return {
      id: item.id,
      tenantId: item.tenantId,
      classId: item.classId,
      className: item.class.name,
      academicPeriodId: item.academicPeriodId,
      academicPeriodName: item.academicPeriod.name,
      classSubjectId: item.classSubjectId,
      subjectId: item.classSubject.subjectId,
      subjectName: item.classSubject.subject.name,
      teacherProfileId: item.classSubject.teacherProfileId,
      teacherName: item.classSubject.teacherProfile.user.name,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private ensureTimeRange(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid time range");
    }

    if (start >= end) {
      throw new BadRequestException("Start time must be before end time");
    }
  }

  private async validateTeacherProfile(tenantId: string, id: string) {
    const teacherProfile = await this.prisma.client.teacherProfile.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        user: { select: { id: true, role: true } },
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

  private async resolveClassSubject(params: {
    tenantId: string;
    academicYearId: string;
    academicPeriodId: string;
    classSubjectId?: string;
    classId?: string;
    subjectId?: string;
    teacherProfileId?: string;
  }) {
    const {
      tenantId,
      academicYearId,
      academicPeriodId,
      classSubjectId,
      classId,
      subjectId,
      teacherProfileId,
    } = params;

    if (classSubjectId) {
      if (classId || subjectId || teacherProfileId) {
        throw new BadRequestException(
          "Provide either classSubjectId or classId/subjectId/teacherProfileId",
        );
      }

      const existing = await this.prisma.client.classSubject.findFirst({
        where: { id: classSubjectId, tenantId, isDeleted: false },
        select: {
          id: true,
          academicYearId: true,
          classId: true,
          subjectId: true,
          teacherProfileId: true,
        },
      });

      if (!existing) {
        throw new NotFoundException("Class subject not found");
      }

      if (existing.academicYearId !== academicYearId) {
        throw new BadRequestException(
          "Class subject does not belong to this academic period",
        );
      }

      return existing;
    }

    if (!classId || !subjectId || !teacherProfileId) {
      throw new BadRequestException(
        "classId, subjectId, and teacherProfileId are required",
      );
    }

    await this.validateTeacherProfile(tenantId, teacherProfileId);

    const classItem = await this.prisma.client.class.findFirst({
      where: { id: classId, tenantId },
      select: { id: true, academicYearId: true },
    });

    if (!classItem) {
      throw new NotFoundException("Class not found");
    }

    if (classItem.academicYearId !== academicYearId) {
      throw new BadRequestException(
        "Class does not belong to this academic period",
      );
    }

    const subject = await this.prisma.client.subject.findFirst({
      where: { id: subjectId, tenantId, isDeleted: false },
      select: { id: true },
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    const existing = await this.prisma.client.classSubject.findFirst({
      where: {
        tenantId,
        classId,
        academicYearId,
        subjectId,
        isDeleted: false,
      },
      select: {
        id: true,
        classId: true,
        subjectId: true,
        academicYearId: true,
        teacherProfileId: true,
      },
    });

    if (existing && existing.teacherProfileId !== teacherProfileId) {
      throw new ConflictException(
        "Class subject already assigned to another teacher",
      );
    }

    if (existing) {
      return existing;
    }

    const softDeleted = await this.prisma.client.classSubject.findFirst({
      where: {
        tenantId,
        classId,
        academicYearId,
        subjectId,
        isDeleted: true,
      },
      select: { id: true },
    });

    if (softDeleted) {
      return this.prisma.client.classSubject.update({
        where: { id: softDeleted.id },
        data: {
          teacherProfileId,
          isDeleted: false,
          deletedAt: null,
        },
        select: {
          id: true,
          classId: true,
          subjectId: true,
          academicYearId: true,
          teacherProfileId: true,
        },
      });
    }

    return this.prisma.client.classSubject.create({
      data: {
        tenantId,
        classId,
        academicYearId,
        subjectId,
        teacherProfileId,
      },
      select: {
        id: true,
        classId: true,
        subjectId: true,
        academicYearId: true,
        teacherProfileId: true,
      },
    });
  }

  private async getScheduleById(tenantId: string, id: string) {
    const schedule = await this.prisma.client.schedule.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicPeriodId: true,
        academicPeriod: {
          select: { id: true, name: true, academicYearId: true },
        },
        classSubjectId: true,
        classSubject: {
          select: {
            id: true,
            subjectId: true,
            subject: { select: { id: true, name: true } },
            teacherProfileId: true,
            teacherProfile: {
              select: { id: true, user: { select: { id: true, name: true } } },
            },
            academicYearId: true,
            classId: true,
          },
        },
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException("Schedule not found");
    }

    return schedule;
  }

  async getSchedules(tenantId: string, query: ScheduleQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 200;

    const where = {
      tenantId,
      ...(query.academicPeriodId
        ? { academicPeriodId: query.academicPeriodId }
        : {}),
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.classSubjectId ? { classSubjectId: query.classSubjectId } : {}),
      ...(query.teacherProfileId
        ? { teacherProfileId: query.teacherProfileId }
        : {}),
      ...(query.dayOfWeek ? { dayOfWeek: query.dayOfWeek } : {}),
      ...(query.subjectId
        ? { classSubject: { subjectId: query.subjectId } }
        : {}),
    };

    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.schedule.findMany({
        where,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          classId: true,
          class: { select: { id: true, name: true } },
          academicPeriodId: true,
          academicPeriod: {
            select: { id: true, name: true, academicYearId: true },
          },
          classSubjectId: true,
          classSubject: {
            select: {
              id: true,
              subjectId: true,
              subject: { select: { id: true, name: true } },
              teacherProfileId: true,
              teacherProfile: {
                select: {
                  id: true,
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.client.schedule.count({ where }),
    ]);

    return {
      data: items.map((item) => this.mapSchedule(item)),
      total,
    };
  }

  async createSchedule(tenantId: string, dto: CreateScheduleDto) {
    this.ensureTimeRange(dto.startTime, dto.endTime);

    const academicPeriod = await this.prisma.client.academicPeriod.findFirst({
      where: { id: dto.academicPeriodId, tenantId },
      select: { id: true, academicYearId: true, name: true },
    });

    if (!academicPeriod) {
      throw new NotFoundException("Academic period not found");
    }

    const classSubject = await this.resolveClassSubject({
      tenantId,
      academicYearId: academicPeriod.academicYearId,
      academicPeriodId: academicPeriod.id,
      classSubjectId: dto.classSubjectId,
      classId: dto.classId,
      subjectId: dto.subjectId,
      teacherProfileId: dto.teacherProfileId,
    });

    const existing = await this.prisma.client.schedule.findFirst({
      where: {
        tenantId,
        teacherProfileId: classSubject.teacherProfileId,
        academicPeriodId: dto.academicPeriodId,
        dayOfWeek: dto.dayOfWeek,
        startTime: new Date(dto.startTime),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        "Teacher already has a schedule at this time",
      );
    }

    const created = await this.prisma.client.schedule.create({
      data: {
        tenantId,
        classId: classSubject.classId,
        academicPeriodId: dto.academicPeriodId,
        classSubjectId: classSubject.id,
        teacherProfileId: classSubject.teacherProfileId,
        dayOfWeek: dto.dayOfWeek,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicPeriodId: true,
        academicPeriod: {
          select: { id: true, name: true, academicYearId: true },
        },
        classSubjectId: true,
        classSubject: {
          select: {
            id: true,
            subjectId: true,
            subject: { select: { id: true, name: true } },
            teacherProfileId: true,
            teacherProfile: {
              select: {
                id: true,
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapSchedule(created);
  }

  async updateSchedule(tenantId: string, id: string, dto: UpdateScheduleDto) {
    const existing = await this.getScheduleById(tenantId, id);

    const nextAcademicPeriodId =
      dto.academicPeriodId ?? existing.academicPeriodId;
    const nextDayOfWeek = dto.dayOfWeek ?? existing.dayOfWeek;
    const nextStartTime = dto.startTime ?? existing.startTime.toISOString();
    const nextEndTime = dto.endTime ?? existing.endTime.toISOString();

    this.ensureTimeRange(nextStartTime, nextEndTime);

    const academicPeriod = await this.prisma.client.academicPeriod.findFirst({
      where: { id: nextAcademicPeriodId, tenantId },
      select: { id: true, academicYearId: true, name: true },
    });

    if (!academicPeriod) {
      throw new NotFoundException("Academic period not found");
    }

    const resolvedClassSubject = await this.resolveClassSubject(
      dto.classSubjectId
        ? {
            tenantId,
            academicYearId: academicPeriod.academicYearId,
            academicPeriodId: academicPeriod.id,
            classSubjectId: dto.classSubjectId,
          }
        : {
            tenantId,
            academicYearId: academicPeriod.academicYearId,
            academicPeriodId: academicPeriod.id,
            classId: dto.classId ?? existing.classId,
            subjectId: dto.subjectId ?? existing.classSubject.subjectId,
            teacherProfileId:
              dto.teacherProfileId ?? existing.classSubject.teacherProfileId,
          },
    );

    const conflict = await this.prisma.client.schedule.findFirst({
      where: {
        tenantId,
        teacherProfileId: resolvedClassSubject.teacherProfileId,
        academicPeriodId: nextAcademicPeriodId,
        dayOfWeek: nextDayOfWeek,
        startTime: new Date(nextStartTime),
        NOT: { id },
      },
      select: { id: true },
    });

    if (conflict) {
      throw new ConflictException(
        "Teacher already has a schedule at this time",
      );
    }

    const updated = await this.prisma.client.schedule.update({
      where: { id },
      data: {
        academicPeriodId: nextAcademicPeriodId,
        classSubjectId: resolvedClassSubject.id,
        classId: resolvedClassSubject.classId,
        teacherProfileId: resolvedClassSubject.teacherProfileId,
        dayOfWeek: nextDayOfWeek,
        startTime: new Date(nextStartTime),
        endTime: new Date(nextEndTime),
      },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicPeriodId: true,
        academicPeriod: {
          select: { id: true, name: true, academicYearId: true },
        },
        classSubjectId: true,
        classSubject: {
          select: {
            id: true,
            subjectId: true,
            subject: { select: { id: true, name: true } },
            teacherProfileId: true,
            teacherProfile: {
              select: {
                id: true,
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.mapSchedule(updated);
  }

  async deleteSchedule(tenantId: string, id: string) {
    const schedule = await this.prisma.client.schedule.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        classId: true,
        _count: { select: { sessions: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException("Schedule not found");
    }

    if ((schedule._count?.sessions ?? 0) > 0) {
      throw new BadRequestException(
        "Schedule cannot be deleted because it already has sessions",
      );
    }

    const deleted = await this.prisma.client.schedule.delete({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        class: { select: { id: true, name: true } },
        academicPeriodId: true,
        academicPeriod: {
          select: { id: true, name: true, academicYearId: true },
        },
        classSubjectId: true,
        classSubject: {
          select: {
            id: true,
            subjectId: true,
            subject: { select: { id: true, name: true } },
            teacherProfileId: true,
            teacherProfile: {
              select: {
                id: true,
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const remainingSchedules = await this.prisma.client.schedule.count({
      where: { tenantId, classSubjectId: deleted.classSubjectId },
    });

    if (remainingSchedules === 0) {
      await this.prisma.client.classSubject.update({
        where: { id: deleted.classSubjectId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }

    return this.mapSchedule(deleted);
  }
}
