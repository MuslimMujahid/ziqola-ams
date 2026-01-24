import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTeacherProfileDto } from "./dto/create-teacher-profile.dto";
import { UpdateTeacherProfileDto } from "./dto/update-teacher-profile.dto";
import { CreateStudentProfileDto } from "./dto/create-student-profile.dto";
import { UpdateStudentProfileDto } from "./dto/update-student-profile.dto";
import { Prisma, Role } from "@repo/db";
import { ListTeacherProfilesDto } from "./dto/list-teacher-profiles.dto";
import { ListStudentProfilesDto } from "./dto/list-student-profiles.dto";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTeacherProfiles(tenantId: string, query: ListTeacherProfilesDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order = query.order ?? "desc";
    const includeCustomFields = query.includeCustomFields ?? false;

    const where: Prisma.TeacherProfileWhereInput = { tenantId };

    if (query.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.teacherProfile.findMany({
        where,
        orderBy: { createdAt: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          userId: true,
          user: { select: { id: true, name: true, email: true } },
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.client.teacherProfile.count({ where }),
    ]);

    if (!includeCustomFields) {
      return {
        data,
        total,
      };
    }

    const profileIds = data.map((profile) => profile.id);
    if (profileIds.length === 0) {
      return {
        data: data.map((profile) => ({
          ...profile,
          customFieldValues: [],
        })),
        total,
      };
    }

    const enabledFields = await this.prisma.client.tenantProfileField.findMany({
      where: {
        tenantId,
        role: "teacher",
        isEnabled: true,
      },
      select: { id: true },
    });

    const enabledFieldIds = enabledFields.map((field) => field.id);
    if (enabledFieldIds.length === 0) {
      return {
        data: data.map((profile) => ({
          ...profile,
          customFieldValues: [],
        })),
        total,
      };
    }

    const values = await this.prisma.client.teacherProfileFieldValue.findMany({
      where: {
        tenantId,
        teacherProfileId: { in: profileIds },
        fieldId: { in: enabledFieldIds },
      },
      select: {
        id: true,
        tenantId: true,
        teacherProfileId: true,
        fieldId: true,
        valueText: true,
        valueNumber: true,
        valueDate: true,
        valueBoolean: true,
        valueSelect: true,
        valueMultiSelect: true,
        valueFile: true,
        updatedAt: true,
      },
    });

    type CustomFieldValue = {
      id: string;
      tenantId: string;
      role: "teacher";
      profileId: string;
      fieldId: string;
      valueText: string | null;
      valueNumber: number | null;
      valueDate: string | null;
      valueBoolean: boolean | null;
      valueSelect: string | null;
      valueMultiSelect: string[] | null;
      valueFile: Prisma.JsonValue | null;
      updatedAt: string;
    };

    const valueMap = new Map<string, CustomFieldValue[]>();

    for (const value of values) {
      const profileId = value.teacherProfileId;
      if (!valueMap.has(profileId)) {
        valueMap.set(profileId, []);
      }

      valueMap.get(profileId)?.push({
        id: value.id,
        tenantId: value.tenantId,
        role: "teacher",
        profileId: value.teacherProfileId,
        fieldId: value.fieldId,
        valueText: value.valueText,
        valueNumber: value.valueNumber,
        valueDate: value.valueDate ? value.valueDate.toISOString() : null,
        valueBoolean: value.valueBoolean,
        valueSelect: value.valueSelect,
        valueMultiSelect: value.valueMultiSelect ?? null,
        valueFile: value.valueFile,
        updatedAt: value.updatedAt.toISOString(),
      });
    }

    return {
      data: data.map((profile) => ({
        ...profile,
        customFieldValues: valueMap.get(profile.id) ?? [],
      })),
      total,
    };
  }

  async listStudentProfiles(tenantId: string, query: ListStudentProfilesDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order = query.order ?? "desc";
    const includeCustomFields = query.includeCustomFields ?? false;

    const where: Prisma.StudentProfileWhereInput = { tenantId };
    const andFilters: Prisma.StudentProfileWhereInput[] = [];

    if (query.search) {
      andFilters.push({
        OR: [
          { user: { name: { contains: query.search, mode: "insensitive" } } },
          { user: { email: { contains: query.search, mode: "insensitive" } } },
        ],
      });
    }

    const enrollmentFilter: Prisma.ClassEnrollmentWhereInput = {
      endDate: null,
      ...(query.academicYearId
        ? { class: { academicYearId: query.academicYearId } }
        : {}),
      ...(query.classId && !query.withoutClass
        ? { classId: query.classId }
        : {}),
    };

    if (query.withoutClass) {
      andFilters.push({
        classEnrollments: {
          none: enrollmentFilter,
        },
      });
    } else if (query.academicYearId || query.classId) {
      andFilters.push({
        classEnrollments: {
          some: enrollmentFilter,
        },
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.studentProfile.findMany({
        where,
        orderBy: { createdAt: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true, email: true } },
          classEnrollments: {
            where: {
              endDate: null,
              ...(query.academicYearId
                ? { class: { academicYearId: query.academicYearId } }
                : {}),
            },
            orderBy: { startDate: "desc" },
            take: 1,
            select: {
              startDate: true,
              endDate: true,
              class: {
                select: {
                  id: true,
                  name: true,
                  academicYearId: true,
                  academicYear: { select: { id: true, label: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.client.studentProfile.count({ where }),
    ]);

    const mapped = data.map((profile) => {
      const activeEnrollment = profile.classEnrollments[0];
      const currentClass = activeEnrollment
        ? {
            id: activeEnrollment.class.id,
            name: activeEnrollment.class.name,
            academicYearId: activeEnrollment.class.academicYearId,
            academicYearLabel:
              activeEnrollment.class.academicYear?.label ?? null,
          }
        : null;

      return {
        id: profile.id,
        tenantId: profile.tenantId,
        userId: profile.userId,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        user: profile.user,
        currentClass,
      };
    });

    if (!includeCustomFields) {
      return {
        data: mapped,
        total,
      };
    }

    const profileIds = mapped.map((profile) => profile.id);
    if (profileIds.length === 0) {
      return {
        data: mapped.map((profile) => ({
          ...profile,
          customFieldValues: [],
        })),
        total,
      };
    }

    const enabledFields = await this.prisma.client.tenantProfileField.findMany({
      where: {
        tenantId,
        role: "student",
        isEnabled: true,
      },
      select: { id: true },
    });

    const enabledFieldIds = enabledFields.map((field) => field.id);
    if (enabledFieldIds.length === 0) {
      return {
        data: mapped.map((profile) => ({
          ...profile,
          customFieldValues: [],
        })),
        total,
      };
    }

    const values = await this.prisma.client.studentProfileFieldValue.findMany({
      where: {
        tenantId,
        studentProfileId: { in: profileIds },
        fieldId: { in: enabledFieldIds },
      },
      select: {
        id: true,
        tenantId: true,
        studentProfileId: true,
        fieldId: true,
        valueText: true,
        valueNumber: true,
        valueDate: true,
        valueBoolean: true,
        valueSelect: true,
        valueMultiSelect: true,
        valueFile: true,
        updatedAt: true,
      },
    });

    type CustomFieldValue = {
      id: string;
      tenantId: string;
      role: "student";
      profileId: string;
      fieldId: string;
      valueText: string | null;
      valueNumber: number | null;
      valueDate: string | null;
      valueBoolean: boolean | null;
      valueSelect: string | null;
      valueMultiSelect: string[] | null;
      valueFile: Prisma.JsonValue | null;
      updatedAt: string;
    };

    const valueMap = new Map<string, CustomFieldValue[]>();

    for (const value of values) {
      const profileId = value.studentProfileId;
      if (!valueMap.has(profileId)) {
        valueMap.set(profileId, []);
      }

      valueMap.get(profileId)?.push({
        id: value.id,
        tenantId: value.tenantId,
        role: "student",
        profileId: value.studentProfileId,
        fieldId: value.fieldId,
        valueText: value.valueText,
        valueNumber: value.valueNumber,
        valueDate: value.valueDate ? value.valueDate.toISOString() : null,
        valueBoolean: value.valueBoolean,
        valueSelect: value.valueSelect,
        valueMultiSelect: value.valueMultiSelect ?? null,
        valueFile: value.valueFile,
        updatedAt: value.updatedAt.toISOString(),
      });
    }

    return {
      data: mapped.map((profile) => ({
        ...profile,
        customFieldValues: valueMap.get(profile.id) ?? [],
      })),
      total,
    };
  }

  async createTeacherProfile(tenantId: string, dto: CreateTeacherProfileDto) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: dto.userId, tenantId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== Role.TEACHER) {
      throw new BadRequestException("User role is not TEACHER");
    }

    const existing = await this.prisma.client.teacherProfile.findFirst({
      where: { userId: dto.userId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("User already has a teacher profile");
    }

    return this.prisma.client.teacherProfile.create({
      data: {
        tenantId,
        userId: dto.userId,
        hiredAt: dto.hiredAt ? new Date(dto.hiredAt) : undefined,
        additionalIdentifiers: dto.additionalIdentifiers
          ? (dto.additionalIdentifiers as Prisma.InputJsonValue)
          : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        hiredAt: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findTeacherProfileById(tenantId: string, id: string) {
    const profile = await this.prisma.client.teacherProfile.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        hiredAt: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    return profile;
  }

  async findTeacherProfileByUserId(tenantId: string, userId: string) {
    const profile = await this.prisma.client.teacherProfile.findFirst({
      where: { userId, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        hiredAt: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    return profile;
  }

  async updateTeacherProfile(
    tenantId: string,
    id: string,
    dto: UpdateTeacherProfileDto,
  ) {
    const existing = await this.prisma.client.teacherProfile.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Teacher profile not found");
    }

    return this.prisma.client.teacherProfile.update({
      where: { id },
      data: {
        ...(dto.hiredAt ? { hiredAt: new Date(dto.hiredAt) } : {}),
        ...(dto.additionalIdentifiers
          ? {
              additionalIdentifiers:
                dto.additionalIdentifiers as Prisma.InputJsonValue,
            }
          : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        hiredAt: true,
        additionalIdentifiers: true,
        updatedAt: true,
      },
    });
  }

  async createStudentProfile(tenantId: string, dto: CreateStudentProfileDto) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: dto.userId, tenantId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== Role.STUDENT) {
      throw new BadRequestException("User role is not STUDENT");
    }

    const existing = await this.prisma.client.studentProfile.findFirst({
      where: { userId: dto.userId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("User already has a student profile");
    }

    return this.prisma.client.studentProfile.create({
      data: {
        tenantId,
        userId: dto.userId,
        additionalIdentifiers: dto.additionalIdentifiers
          ? (dto.additionalIdentifiers as Prisma.InputJsonValue)
          : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findStudentProfileById(tenantId: string, id: string) {
    const profile = await this.prisma.client.studentProfile.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    return profile;
  }

  async findStudentProfileByUserId(tenantId: string, userId: string) {
    const profile = await this.prisma.client.studentProfile.findFirst({
      where: { userId, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    return profile;
  }

  async updateStudentProfile(
    tenantId: string,
    id: string,
    dto: UpdateStudentProfileDto,
  ) {
    const existing = await this.prisma.client.studentProfile.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Student profile not found");
    }

    return this.prisma.client.studentProfile.update({
      where: { id },
      data: {
        ...(dto.additionalIdentifiers
          ? {
              additionalIdentifiers:
                dto.additionalIdentifiers as Prisma.InputJsonValue,
            }
          : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        additionalIdentifiers: true,
        updatedAt: true,
      },
    });
  }
}
