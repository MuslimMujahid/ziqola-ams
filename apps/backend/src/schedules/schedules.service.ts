import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@repo/db";

import { PrismaService } from "../prisma/prisma.service";
import { SessionsService } from "../sessions/sessions.service";
import { ScheduleQueryDto } from "./dto/schedule-query.dto";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

type ScheduleActor = {
  sub: string;
  tenantId: string;
  role: Role;
};

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
  ) {}

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
    if (new Date(startTime).getTime() >= new Date(endTime).getTime()) {
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

  private getTeacherSubjectClient() {
    const client = this.prisma.client as unknown as {
      teacherSubject: {
        upsert: (args: unknown) => Promise<{ id: string }>;
      };
    };

    return client.teacherSubject;
  }

  private async upsertTeacherSubject(
    tenantId: string,
    teacherProfileId: string,
    subjectId: string,
  ) {
    await this.getTeacherSubjectClient().upsert({
      where: {
        tenantId_teacherProfileId_subjectId: {
          tenantId,
          teacherProfileId,
          subjectId,
        },
      },
      create: {
        tenantId,
        teacherProfileId,
        subjectId,
      },
      update: {},
      select: { id: true },
    });
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

    let classSubject: {
      id: string;
      classId: string;
      subjectId: string;
      academicYearId: string;
      teacherProfileId: string;
    } | null = null;

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

      classSubject = existing;
    }

    if (!classSubject && (!classId || !subjectId || !teacherProfileId)) {
      throw new BadRequestException(
        "classId, subjectId, and teacherProfileId are required",
      );
    }

    if (!classSubject) {
      const resolvedClassId = classId as string;
      const resolvedSubjectId = subjectId as string;
      const resolvedTeacherProfileId = teacherProfileId as string;

      await this.validateTeacherProfile(tenantId, resolvedTeacherProfileId);

      const classItem = await this.prisma.client.class.findFirst({
        where: { id: resolvedClassId, tenantId },
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
        where: { id: resolvedSubjectId, tenantId, isDeleted: false },
        select: { id: true },
      });

      if (!subject) {
        throw new NotFoundException("Subject not found");
      }

      const existing = await this.prisma.client.classSubject.findFirst({
        where: {
          tenantId,
          classId: resolvedClassId,
          academicYearId,
          subjectId: resolvedSubjectId,
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

      if (existing && existing.teacherProfileId !== resolvedTeacherProfileId) {
        throw new ConflictException(
          "Class subject already assigned to another teacher",
        );
      }

      if (existing) {
        classSubject = existing;
      }
    }

    if (!classSubject) {
      const softDeleted = await this.prisma.client.classSubject.findFirst({
        where: {
          tenantId,
          classId: classId as string,
          academicYearId,
          subjectId: subjectId as string,
          isDeleted: true,
        },
        select: { id: true },
      });

      if (softDeleted) {
        classSubject = await this.prisma.client.classSubject.update({
          where: { id: softDeleted.id },
          data: {
            teacherProfileId: teacherProfileId as string,
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
      } else {
        classSubject = await this.prisma.client.classSubject.create({
          data: {
            tenantId,
            classId: classId as string,
            academicYearId,
            subjectId: subjectId as string,
            teacherProfileId: teacherProfileId as string,
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
    }

    if (!classSubject) {
      throw new NotFoundException("Class subject not resolved");
    }

    await this.upsertTeacherSubject(
      tenantId,
      classSubject.teacherProfileId,
      classSubject.subjectId,
    );

    return classSubject;
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

  private async resolveStudentClassId(tenantId: string, userId: string) {
    const studentProfile = await this.prisma.client.studentProfile.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!studentProfile) {
      return null;
    }

    const enrollment = await this.prisma.client.classEnrollment.findFirst({
      where: {
        tenantId,
        studentProfileId: studentProfile.id,
        endDate: null,
      },
      orderBy: { startDate: "desc" },
      select: { classId: true },
    });

    return enrollment?.classId ?? null;
  }

  async getSchedules(
    tenantId: string,
    query: ScheduleQueryDto,
    actor?: ScheduleActor,
  ) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 200;

    let classIdFilter: string | undefined = query.classId;

    if (actor?.role === Role.STUDENT) {
      const studentClassId = await this.resolveStudentClassId(
        tenantId,
        actor.sub,
      );

      if (!studentClassId) {
        return { data: [], total: 0 };
      }

      classIdFilter = studentClassId;
    }

    const where = {
      tenantId,
      ...(query.academicPeriodId
        ? { academicPeriodId: query.academicPeriodId }
        : {}),
      ...(classIdFilter ? { classId: classIdFilter } : {}),
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

    await this.sessionsService.generateSessionsForSchedule(
      tenantId,
      created.id,
    );

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

    await this.sessionsService.generateSessionsForSchedule(
      tenantId,
      updated.id,
    );

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
