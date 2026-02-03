import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttendanceStatus, Role } from "@repo/db";

import { PrismaService } from "../prisma/prisma.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { SessionQueryDto } from "./dto/session-query.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";
import { GenerateSessionsDto } from "./dto/generate-sessions.dto";

export type SessionSummary = {
  id: string;
  tenantId: string;
  classId: string;
  className: string;
  academicPeriodId: string | null;
  academicPeriodName: string | null;
  classSubjectId: string;
  subjectId: string;
  subjectName: string;
  teacherProfileId: string;
  teacherName: string;
  scheduleId: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
};

type SessionAttendanceStudent = {
  studentProfileId: string;
  studentName: string;
  studentNis: string | null;
  studentNisn: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
};

export type SessionAttendanceSummary = {
  sessionId: string;
  classId: string;
  date: Date;
  students: SessionAttendanceStudent[];
};

type SessionActor = {
  sub: string;
  tenantId: string;
  role: Role;
};

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly sessionSelect = {
    id: true,
    tenantId: true,
    classId: true,
    class: { select: { id: true, name: true } },
    academicPeriodId: true,
    academicPeriod: { select: { id: true, name: true, academicYearId: true } },
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
    scheduleId: true,
    date: true,
    startTime: true,
    endTime: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private mapSession(item: {
    id: string;
    tenantId: string;
    classId: string;
    class: { id: string; name: string };
    academicPeriodId: string | null;
    academicPeriod: { id: string; name: string; academicYearId: string } | null;
    classSubjectId: string;
    classSubject: {
      id: string;
      subjectId: string;
      subject: { id: string; name: string };
      teacherProfileId: string;
      teacherProfile: { id: string; user: { id: string; name: string } };
    };
    scheduleId: string | null;
    date: Date;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
  }): SessionSummary {
    return {
      id: item.id,
      tenantId: item.tenantId,
      classId: item.classId,
      className: item.class.name,
      academicPeriodId: item.academicPeriodId ?? null,
      academicPeriodName: item.academicPeriod?.name ?? null,
      classSubjectId: item.classSubjectId,
      subjectId: item.classSubject.subjectId,
      subjectName: item.classSubject.subject.name,
      teacherProfileId: item.classSubject.teacherProfileId,
      teacherName: item.classSubject.teacherProfile.user.name,
      scheduleId: item.scheduleId ?? null,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private toDateOnly(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Invalid date");
    }

    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }

  private combineDateTime(dateValue: string, timeValue: string) {
    const date = new Date(dateValue);
    const time = new Date(timeValue);

    if (Number.isNaN(date.getTime()) || Number.isNaN(time.getTime())) {
      throw new BadRequestException("Invalid time range");
    }

    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        time.getUTCHours(),
        time.getUTCMinutes(),
        time.getUTCSeconds(),
        time.getUTCMilliseconds(),
      ),
    );
  }

  private ensureTimeRange(params: {
    dateValue?: string;
    startTimeValue: string;
    endTimeValue: string;
    useDateOverride?: boolean;
  }) {
    const { dateValue, startTimeValue, endTimeValue, useDateOverride } = params;
    const start = new Date(startTimeValue);
    const end = new Date(endTimeValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid time range");
    }

    if (useDateOverride && dateValue) {
      const dateOnly = this.toDateOnly(dateValue);
      const adjustedStart = this.combineDateTime(dateValue, startTimeValue);
      const adjustedEnd = this.combineDateTime(dateValue, endTimeValue);

      if (adjustedStart >= adjustedEnd) {
        throw new BadRequestException("Start time must be before end time");
      }

      return { date: dateOnly, startTime: adjustedStart, endTime: adjustedEnd };
    }

    if (start >= end) {
      throw new BadRequestException("Start time must be before end time");
    }

    return {
      date: this.toDateOnly(startTimeValue),
      startTime: start,
      endTime: end,
    };
  }

  private formatDateOnly(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private normalizeDayOfWeek(value: number) {
    return value === 0 ? 7 : value;
  }

  private addDaysUTC(date: Date, days: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private maxDate(left: Date, right: Date) {
    return left >= right ? left : right;
  }

  private minDate(left: Date, right: Date) {
    return left <= right ? left : right;
  }

  private getNextDateForDayOfWeek(startDate: Date, dayOfWeek: number) {
    const date = new Date(startDate);
    const startDay = this.normalizeDayOfWeek(date.getUTCDay());
    let diff = dayOfWeek - startDay;
    if (diff < 0) diff += 7;
    return this.addDaysUTC(date, diff);
  }

  private parseWindowDays(value?: string) {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.trunc(parsed);
  }

  private getRemainingWindowDays(baseWindowDays: number) {
    const schedule = process.env.SESSIONS_CRON_SCHEDULE;

    if (!schedule) {
      return baseWindowDays;
    }

    const [minuteRaw, hourRaw] = schedule.trim().split(/\s+/);
    const minute = Number(minuteRaw);
    const hour = Number(hourRaw);

    if (
      !Number.isInteger(minute) ||
      !Number.isInteger(hour) ||
      minute < 0 ||
      minute > 59 ||
      hour < 0 ||
      hour > 23
    ) {
      return baseWindowDays;
    }

    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(hour, minute, 0, 0);

    if (now < scheduled) {
      scheduled.setDate(scheduled.getDate() - 1);
    }

    const windowStart = this.toDateOnly(scheduled.toISOString());
    const windowEnd = this.addDaysUTC(windowStart, baseWindowDays - 1);
    const today = this.toDateOnly(now.toISOString());

    const remaining =
      Math.floor((windowEnd.getTime() - today.getTime()) / 86400000) + 1;

    if (!Number.isFinite(remaining)) {
      return baseWindowDays;
    }

    return Math.min(Math.max(remaining, 1), baseWindowDays);
  }

  private async resolveAcademicPeriod(tenantId: string, id: string) {
    const academicPeriod = await this.prisma.client.academicPeriod.findFirst({
      where: { id, tenantId },
      select: { id: true, academicYearId: true },
    });

    if (!academicPeriod) {
      throw new NotFoundException("Academic period not found");
    }

    return academicPeriod;
  }

  private async resolveTeacherProfileId(tenantId: string, userId: string) {
    const teacherProfile = await this.prisma.client.teacherProfile.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!teacherProfile) {
      throw new NotFoundException("Teacher profile not found");
    }

    return teacherProfile.id;
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
    academicPeriodId: string;
    classSubjectId?: string;
    classId?: string;
    subjectId?: string;
    teacherProfileId?: string;
  }) {
    const {
      tenantId,
      academicPeriodId,
      classSubjectId,
      classId,
      subjectId,
      teacherProfileId,
    } = params;

    const academicPeriod = await this.resolveAcademicPeriod(
      tenantId,
      academicPeriodId,
    );

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

      if (existing.academicYearId !== academicPeriod.academicYearId) {
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

    const existing = await this.prisma.client.classSubject.findFirst({
      where: {
        tenantId,
        classId,
        academicYearId: academicPeriod.academicYearId,
        subjectId,
        teacherProfileId,
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

    if (!existing) {
      throw new NotFoundException("Class subject not found");
    }

    return existing;
  }

  private async resolveSchedule(tenantId: string, id: string) {
    const schedule = await this.prisma.client.schedule.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        classId: true,
        academicPeriodId: true,
        classSubjectId: true,
        teacherProfileId: true,
        teacherProfile: { select: { userId: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException("Schedule not found");
    }

    return schedule;
  }

  private async ensureNoConflicts(params: {
    tenantId: string;
    classId: string;
    teacherProfileId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    excludeId?: string;
  }) {
    const { tenantId, classId, teacherProfileId, date, startTime, endTime } =
      params;

    const conflict = await this.prisma.client.session.findFirst({
      where: {
        tenantId,
        date,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
        OR: [{ classId }, { classSubject: { teacherProfileId } }],
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });

    if (conflict) {
      throw new ConflictException(
        "Session time conflicts with existing session",
      );
    }
  }

  private async ensureNoDuplicateScheduleSession(params: {
    tenantId: string;
    scheduleId: string;
    date: Date;
    excludeId?: string;
  }) {
    const { tenantId, scheduleId, date } = params;

    const existing = await this.prisma.client.session.findFirst({
      where: {
        tenantId,
        scheduleId,
        date,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        "Session already exists for this schedule and date",
      );
    }
  }

  private async ensureSessionAccess(
    tenantId: string,
    sessionId: string,
    actor?: SessionActor,
  ) {
    const session = await this.prisma.client.session.findFirst({
      where: { id: sessionId, tenantId },
      select: this.sessionSelect,
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    if (actor?.role === Role.TEACHER) {
      const teacherProfileId = await this.resolveTeacherProfileId(
        tenantId,
        actor.sub,
      );

      if (session.classSubject.teacherProfileId !== teacherProfileId) {
        throw new ForbiddenException("Teacher cannot access this session");
      }
    }

    return session;
  }

  private async getSessionRoster(params: {
    tenantId: string;
    classId: string;
    sessionDate: Date;
  }) {
    const { tenantId, classId, sessionDate } = params;

    return this.prisma.client.classEnrollment.findMany({
      where: {
        tenantId,
        classId,
        startDate: { lte: sessionDate },
        OR: [{ endDate: null }, { endDate: { gte: sessionDate } }],
      },
      select: {
        studentProfileId: true,
        studentProfile: {
          select: {
            nis: true,
            nisn: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: {
        studentProfile: {
          user: { name: "asc" },
        },
      },
    });
  }

  async getSessions(
    tenantId: string,
    query: SessionQueryDto,
    actor?: SessionActor,
  ) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 200;

    let teacherProfileIdFilter: string | undefined = query.teacherProfileId;
    let classIdFilter: string | undefined = query.classId;

    if (actor?.role === Role.TEACHER) {
      teacherProfileIdFilter = await this.resolveTeacherProfileId(
        tenantId,
        actor.sub,
      );
    }

    if (actor?.role === Role.STUDENT) {
      const studentClassId = await this.resolveStudentClassId(
        tenantId,
        actor.sub,
      );

      if (!studentClassId) {
        return { data: [], total: 0 };
      }

      classIdFilter = studentClassId;
      teacherProfileIdFilter = undefined;
    }

    const dateFrom = query.dateFrom
      ? this.toDateOnly(query.dateFrom)
      : undefined;
    const dateTo = query.dateTo ? this.toDateOnly(query.dateTo) : undefined;
    const dateToExclusive = dateTo ? this.addDaysUTC(dateTo, 1) : undefined;

    const where = {
      tenantId,
      ...(query.academicPeriodId
        ? { academicPeriodId: query.academicPeriodId }
        : {}),
      ...(classIdFilter ? { classId: classIdFilter } : {}),
      ...(query.classSubjectId ? { classSubjectId: query.classSubjectId } : {}),
      ...(query.scheduleId ? { scheduleId: query.scheduleId } : {}),
      ...(query.subjectId
        ? { classSubject: { subjectId: query.subjectId } }
        : {}),
      ...(teacherProfileIdFilter
        ? { classSubject: { teacherProfileId: teacherProfileIdFilter } }
        : {}),
      ...(dateFrom || dateToExclusive
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateToExclusive ? { lt: dateToExclusive } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.session.findMany({
        where,
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
        skip: offset,
        take: limit,
        select: this.sessionSelect,
      }),
      this.prisma.client.session.count({ where }),
    ]);

    return {
      data: items.map((item) => this.mapSession(item)),
      total,
    };
  }

  async getSessionDetail(
    tenantId: string,
    sessionId: string,
    actor?: SessionActor,
  ) {
    const session = await this.ensureSessionAccess(tenantId, sessionId, actor);
    return this.mapSession(session);
  }

  async getSessionAttendance(
    tenantId: string,
    sessionId: string,
    actor?: SessionActor,
  ): Promise<SessionAttendanceSummary> {
    const session = await this.ensureSessionAccess(tenantId, sessionId, actor);
    const roster = await this.getSessionRoster({
      tenantId,
      classId: session.classId,
      sessionDate: session.date,
    });

    const attendance = await this.prisma.client.attendance.findMany({
      where: { tenantId, sessionId: session.id },
      select: { studentProfileId: true, status: true, remarks: true },
    });

    const attendanceMap = new Map(
      attendance.map((item) => [item.studentProfileId, item]),
    );

    const students = roster.map((item) => {
      const current = attendanceMap.get(item.studentProfileId);
      return {
        studentProfileId: item.studentProfileId,
        studentName: item.studentProfile.user.name,
        studentNis: item.studentProfile.nis ?? null,
        studentNisn: item.studentProfile.nisn ?? null,
        status: current?.status ?? null,
        remarks: current?.remarks ?? null,
      };
    });

    return {
      sessionId: session.id,
      classId: session.classId,
      date: session.date,
      students,
    };
  }

  async recordSessionAttendance(
    tenantId: string,
    sessionId: string,
    items: {
      studentProfileId: string;
      status: AttendanceStatus;
      remarks?: string | null;
    }[],
    actor: SessionActor,
  ): Promise<SessionAttendanceSummary> {
    const session = await this.ensureSessionAccess(tenantId, sessionId, actor);
    const roster = await this.getSessionRoster({
      tenantId,
      classId: session.classId,
      sessionDate: session.date,
    });

    const rosterIds = new Set(
      roster.map((student) => student.studentProfileId),
    );

    const normalizedItems = Array.from(
      new Map(
        items.map((item) => [item.studentProfileId, item] as const),
      ).values(),
    );

    const invalidStudents = normalizedItems.filter(
      (item) => !rosterIds.has(item.studentProfileId),
    );

    if (invalidStudents.length > 0) {
      throw new BadRequestException("Student not enrolled in this class");
    }

    if (normalizedItems.length === 0) {
      throw new BadRequestException("Attendance payload is empty");
    }

    await this.prisma.client.$transaction(
      normalizedItems.map((item) =>
        this.prisma.client.attendance.upsert({
          where: {
            sessionId_studentProfileId: {
              sessionId: session.id,
              studentProfileId: item.studentProfileId,
            },
          },
          update: {
            status: item.status,
            remarks: item.remarks ?? null,
          },
          create: {
            tenantId,
            sessionId: session.id,
            studentProfileId: item.studentProfileId,
            status: item.status,
            remarks: item.remarks ?? null,
          },
        }),
      ),
    );

    return this.getSessionAttendance(tenantId, session.id, actor);
  }

  async createSession(
    tenantId: string,
    dto: CreateSessionDto,
    actor: SessionActor,
  ) {
    const timeRange = this.ensureTimeRange({
      startTimeValue: dto.startTime,
      endTimeValue: dto.endTime,
    });

    let classSubjectId: string;
    let classId: string;
    let academicPeriodId: string | null = null;
    let teacherProfileId: string;
    let scheduleId: string | null = null;

    if (dto.scheduleId) {
      if (
        dto.academicPeriodId ||
        dto.classSubjectId ||
        dto.classId ||
        dto.subjectId ||
        dto.teacherProfileId
      ) {
        throw new BadRequestException(
          "Do not provide class or academic period when scheduleId is set",
        );
      }

      const schedule = await this.resolveSchedule(tenantId, dto.scheduleId);

      if (
        actor.role === Role.TEACHER &&
        schedule.teacherProfile.userId !== actor.sub
      ) {
        throw new ForbiddenException("Teacher cannot start this session");
      }

      scheduleId = schedule.id;
      academicPeriodId = schedule.academicPeriodId;
      classSubjectId = schedule.classSubjectId;
      classId = schedule.classId;
      teacherProfileId = schedule.teacherProfileId;
    } else {
      if (actor.role === Role.TEACHER) {
        throw new BadRequestException(
          "Teacher must start session from schedule",
        );
      }

      if (!dto.academicPeriodId) {
        throw new BadRequestException("academicPeriodId is required");
      }

      const classSubject = await this.resolveClassSubject({
        tenantId,
        academicPeriodId: dto.academicPeriodId,
        classSubjectId: dto.classSubjectId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherProfileId: dto.teacherProfileId,
      });

      academicPeriodId = dto.academicPeriodId;
      classSubjectId = classSubject.id;
      classId = classSubject.classId;
      teacherProfileId = classSubject.teacherProfileId;
    }

    if (scheduleId) {
      await this.ensureNoDuplicateScheduleSession({
        tenantId,
        scheduleId,
        date: timeRange.date,
      });
    }

    await this.ensureNoConflicts({
      tenantId,
      classId,
      teacherProfileId,
      date: timeRange.date,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
    });

    const session = await this.prisma.client.session.create({
      data: {
        tenantId,
        classId,
        academicPeriodId,
        classSubjectId,
        scheduleId,
        date: timeRange.date,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
      },
      select: this.sessionSelect,
    });

    return this.mapSession(session);
  }

  async updateSession(
    tenantId: string,
    id: string,
    dto: UpdateSessionDto,
    actor: SessionActor,
  ) {
    if (actor.role === Role.TEACHER) {
      throw new ForbiddenException("Teacher cannot update sessions");
    }

    const existing = await this.prisma.client.session.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        academicPeriodId: true,
        classSubjectId: true,
        scheduleId: true,
        date: true,
        startTime: true,
        endTime: true,
        classSubject: { select: { teacherProfileId: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException("Session not found");
    }

    let classSubjectId = existing.classSubjectId;
    let classId = existing.classId;
    let academicPeriodId = existing.academicPeriodId;
    let teacherProfileId = existing.classSubject.teacherProfileId;
    let scheduleId = existing.scheduleId;

    if (dto.scheduleId) {
      if (
        dto.academicPeriodId ||
        dto.classSubjectId ||
        dto.classId ||
        dto.subjectId ||
        dto.teacherProfileId
      ) {
        throw new BadRequestException(
          "Do not provide class or academic period when scheduleId is set",
        );
      }

      const schedule = await this.resolveSchedule(tenantId, dto.scheduleId);

      scheduleId = schedule.id;
      academicPeriodId = schedule.academicPeriodId;
      classSubjectId = schedule.classSubjectId;
      classId = schedule.classId;
      teacherProfileId = schedule.teacherProfileId;
    } else if (
      dto.classSubjectId ||
      dto.classId ||
      dto.subjectId ||
      dto.teacherProfileId
    ) {
      const resolvedAcademicPeriodId = dto.academicPeriodId ?? academicPeriodId;

      if (!resolvedAcademicPeriodId) {
        throw new BadRequestException("academicPeriodId is required");
      }

      const classSubject = await this.resolveClassSubject({
        tenantId,
        academicPeriodId: resolvedAcademicPeriodId,
        classSubjectId: dto.classSubjectId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherProfileId: dto.teacherProfileId,
      });

      academicPeriodId = resolvedAcademicPeriodId;
      classSubjectId = classSubject.id;
      classId = classSubject.classId;
      teacherProfileId = classSubject.teacherProfileId;
      scheduleId = null;
    } else if (dto.academicPeriodId) {
      throw new BadRequestException(
        "academicPeriodId requires class subject reassignment",
      );
    }

    const startTimeValue = dto.startTime ?? existing.startTime.toISOString();
    const endTimeValue = dto.endTime ?? existing.endTime.toISOString();
    const dateValue = dto.date ?? this.formatDateOnly(existing.date);
    const useDateOverride = Boolean(dto.date) && !dto.startTime && !dto.endTime;

    const timeRange = this.ensureTimeRange({
      dateValue,
      startTimeValue,
      endTimeValue,
      useDateOverride,
    });

    if (scheduleId) {
      await this.ensureNoDuplicateScheduleSession({
        tenantId,
        scheduleId,
        date: timeRange.date,
        excludeId: existing.id,
      });
    }

    await this.ensureNoConflicts({
      tenantId,
      classId,
      teacherProfileId,
      date: timeRange.date,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      excludeId: existing.id,
    });

    const session = await this.prisma.client.session.update({
      where: { id: existing.id },
      data: {
        classId,
        academicPeriodId,
        classSubjectId,
        scheduleId,
        date: timeRange.date,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
      },
      select: this.sessionSelect,
    });

    return this.mapSession(session);
  }

  async generateScheduledSessions(dto: GenerateSessionsDto) {
    const windowDays = Math.min(Math.max(dto.windowDays ?? 7, 1), 31);
    const startDate = dto.startDate
      ? this.toDateOnly(dto.startDate)
      : this.toDateOnly(new Date().toISOString());
    const endDate = this.addDaysUTC(startDate, windowDays - 1);

    const tenants = await this.prisma.client.tenant.findMany({
      where: dto.tenantId
        ? { id: dto.tenantId }
        : { activeAcademicYearId: { not: null } },
      select: { id: true, activeAcademicYearId: true },
    });

    let created = 0;
    let skippedExisting = 0;
    let skippedConflicts = 0;
    let tenantsProcessed = 0;
    let schedulesProcessed = 0;

    for (const tenant of tenants) {
      if (!tenant.activeAcademicYearId) {
        continue;
      }

      const academicYear = await this.prisma.client.academicYear.findFirst({
        where: { id: tenant.activeAcademicYearId, tenantId: tenant.id },
        select: {
          activePeriod: {
            select: { id: true, startDate: true, endDate: true },
          },
        },
      });

      if (!academicYear?.activePeriod) {
        continue;
      }

      const periodStart = this.toDateOnly(
        academicYear.activePeriod.startDate.toISOString(),
      );
      const periodEnd = academicYear.activePeriod.endDate
        ? this.toDateOnly(academicYear.activePeriod.endDate.toISOString())
        : endDate;

      const rangeStart = this.maxDate(startDate, periodStart);
      const rangeEnd = this.minDate(endDate, periodEnd);

      if (rangeStart > rangeEnd) {
        continue;
      }

      const schedules = await this.prisma.client.schedule.findMany({
        where: {
          tenantId: tenant.id,
          academicPeriodId: academicYear.activePeriod.id,
        },
        select: {
          id: true,
          classId: true,
          classSubjectId: true,
          teacherProfileId: true,
          academicPeriodId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      });

      if (schedules.length === 0) {
        continue;
      }

      tenantsProcessed += 1;
      schedulesProcessed += schedules.length;

      const scheduleIds = schedules.map((schedule) => schedule.id);
      const existingSessions = await this.prisma.client.session.findMany({
        where: {
          tenantId: tenant.id,
          scheduleId: { in: scheduleIds },
          date: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: { scheduleId: true, date: true },
      });

      const existingKeys = new Set(
        existingSessions.map(
          (session) =>
            `${session.scheduleId}:${this.formatDateOnly(session.date)}`,
        ),
      );

      for (const schedule of schedules) {
        let cursor = this.getNextDateForDayOfWeek(
          rangeStart,
          schedule.dayOfWeek,
        );

        while (cursor <= rangeEnd) {
          const dateKey = `${schedule.id}:${this.formatDateOnly(cursor)}`;

          if (existingKeys.has(dateKey)) {
            skippedExisting += 1;
            cursor = this.addDaysUTC(cursor, 7);
            continue;
          }

          const dateString = this.formatDateOnly(cursor);
          const dateOnly = this.toDateOnly(dateString);
          const startTime = this.combineDateTime(
            dateString,
            schedule.startTime.toISOString(),
          );
          const endTime = this.combineDateTime(
            dateString,
            schedule.endTime.toISOString(),
          );

          try {
            await this.ensureNoConflicts({
              tenantId: tenant.id,
              classId: schedule.classId,
              teacherProfileId: schedule.teacherProfileId,
              date: dateOnly,
              startTime,
              endTime,
            });
          } catch (error) {
            if (error instanceof ConflictException) {
              skippedConflicts += 1;
              cursor = this.addDaysUTC(cursor, 7);
              continue;
            }

            throw error;
          }

          await this.prisma.client.session.create({
            data: {
              tenantId: tenant.id,
              classId: schedule.classId,
              academicPeriodId: schedule.academicPeriodId,
              classSubjectId: schedule.classSubjectId,
              scheduleId: schedule.id,
              date: dateOnly,
              startTime,
              endTime,
            },
          });

          existingKeys.add(dateKey);
          created += 1;
          cursor = this.addDaysUTC(cursor, 7);
        }
      }
    }

    return {
      windowDays,
      startDate: this.formatDateOnly(startDate),
      endDate: this.formatDateOnly(endDate),
      tenantsProcessed,
      schedulesProcessed,
      created,
      skippedExisting,
      skippedConflicts,
    };
  }

  async generateSessionsForSchedule(
    tenantId: string,
    scheduleId: string,
    options?: { startDate?: string; windowDays?: number },
  ) {
    const envWindowDays = this.parseWindowDays(
      process.env.SESSIONS_WINDOW_DAYS,
    );
    const baseWindowDays = options?.windowDays ?? envWindowDays ?? 7;
    const windowDays = Math.min(
      Math.max(
        options?.windowDays
          ? baseWindowDays
          : this.getRemainingWindowDays(baseWindowDays),
        1,
      ),
      31,
    );
    const startDate = options?.startDate
      ? this.toDateOnly(options.startDate)
      : this.toDateOnly(new Date().toISOString());
    const endDate = this.addDaysUTC(startDate, windowDays - 1);

    const schedule = await this.prisma.client.schedule.findFirst({
      where: { id: scheduleId, tenantId },
      select: {
        id: true,
        classId: true,
        classSubjectId: true,
        teacherProfileId: true,
        academicPeriodId: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException("Schedule not found");
    }

    const academicPeriod = await this.prisma.client.academicPeriod.findFirst({
      where: { id: schedule.academicPeriodId, tenantId },
      select: { startDate: true, endDate: true },
    });

    if (!academicPeriod) {
      throw new NotFoundException("Academic period not found");
    }

    const periodStart = this.toDateOnly(academicPeriod.startDate.toISOString());
    const periodEnd = academicPeriod.endDate
      ? this.toDateOnly(academicPeriod.endDate.toISOString())
      : endDate;

    const rangeStart = this.maxDate(startDate, periodStart);
    const rangeEnd = this.minDate(endDate, periodEnd);

    if (rangeStart > rangeEnd) {
      return {
        windowDays,
        startDate: this.formatDateOnly(startDate),
        endDate: this.formatDateOnly(endDate),
        created: 0,
        skippedExisting: 0,
        skippedConflicts: 0,
      };
    }

    const existingSessions = await this.prisma.client.session.findMany({
      where: {
        tenantId,
        scheduleId: schedule.id,
        date: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      select: { date: true },
    });

    const existingKeys = new Set(
      existingSessions.map((session) => this.formatDateOnly(session.date)),
    );

    let created = 0;
    let skippedExisting = 0;
    let skippedConflicts = 0;

    let cursor = this.getNextDateForDayOfWeek(rangeStart, schedule.dayOfWeek);

    while (cursor <= rangeEnd) {
      const dateLabel = this.formatDateOnly(cursor);

      if (existingKeys.has(dateLabel)) {
        skippedExisting += 1;
        cursor = this.addDaysUTC(cursor, 7);
        continue;
      }

      const dateOnly = this.toDateOnly(dateLabel);
      const startTime = this.combineDateTime(
        dateLabel,
        schedule.startTime.toISOString(),
      );
      const endTime = this.combineDateTime(
        dateLabel,
        schedule.endTime.toISOString(),
      );

      try {
        await this.ensureNoConflicts({
          tenantId,
          classId: schedule.classId,
          teacherProfileId: schedule.teacherProfileId,
          date: dateOnly,
          startTime,
          endTime,
        });
      } catch (error) {
        if (error instanceof ConflictException) {
          skippedConflicts += 1;
          cursor = this.addDaysUTC(cursor, 7);
          continue;
        }

        throw error;
      }

      await this.prisma.client.session.create({
        data: {
          tenantId,
          classId: schedule.classId,
          academicPeriodId: schedule.academicPeriodId,
          classSubjectId: schedule.classSubjectId,
          scheduleId: schedule.id,
          date: dateOnly,
          startTime,
          endTime,
        },
      });

      existingKeys.add(dateLabel);
      created += 1;
      cursor = this.addDaysUTC(cursor, 7);
    }

    return {
      windowDays,
      startDate: this.formatDateOnly(startDate),
      endDate: this.formatDateOnly(endDate),
      created,
      skippedExisting,
      skippedConflicts,
    };
  }

  async deleteSession(tenantId: string, id: string, actor: SessionActor) {
    if (actor.role === Role.TEACHER) {
      throw new ForbiddenException("Teacher cannot delete sessions");
    }

    const existing = await this.prisma.client.session.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        date: true,
        _count: { select: { attendance: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException("Session not found");
    }

    if ((existing._count.attendance ?? 0) > 0) {
      throw new BadRequestException(
        "Session cannot be deleted because it already has attendance",
      );
    }

    await this.prisma.client.session.delete({ where: { id } });

    return { id: existing.id, date: existing.date };
  }
}
