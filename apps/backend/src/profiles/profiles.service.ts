import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTeacherProfileDto } from "./dto/create-teacher-profile.dto";
import { UpdateTeacherProfileDto } from "./dto/update-teacher-profile.dto";
import { CreateStudentProfileDto } from "./dto/create-student-profile.dto";
import { UpdateStudentProfileDto } from "./dto/update-student-profile.dto";
import { Prisma, Role } from "@repo/db";
import { ListTeacherProfilesDto } from "./dto/list-teacher-profiles.dto";
import { ListStudentProfilesDto } from "./dto/list-student-profiles.dto";
import { ImportStudentsDto } from "./dto/import-students.dto";
import { EmailService } from "../common/email/email.service";

const INVITE_EXPIRY_HOURS = 72;
const STATUS_INVITED = "INVITED";

type ImportStudentsError = {
  rowIndex: number | null;
  field: string;
  message: string;
};

type ImportStudentsResult = {
  createdCount: number;
  errors: ImportStudentsError[];
};

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

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
          nis: true,
          nisn: true,
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
        nis: profile.nis ?? null,
        nisn: profile.nisn ?? null,
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
        ...(dto.gender ? { gender: dto.gender } : {}),
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
        additionalIdentifiers: dto.additionalIdentifiers
          ? (dto.additionalIdentifiers as Prisma.InputJsonValue)
          : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        hiredAt: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
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
          },
        },
        hiredAt: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
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
          },
        },
        hiredAt: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
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
        ...(dto.gender ? { gender: dto.gender } : {}),
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
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
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
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
        ...(dto.nis ? { nis: dto.nis } : {}),
        ...(dto.nisn ? { nisn: dto.nisn } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        nis: true,
        nisn: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
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
          },
        },
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        nis: true,
        nisn: true,
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
          },
        },
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        nis: true,
        nisn: true,
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
        ...(dto.nis ? { nis: dto.nis } : {}),
        ...(dto.nisn ? { nisn: dto.nisn } : {}),
        ...(dto.gender ? { gender: dto.gender } : {}),
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        gender: true,
        dateOfBirth: true,
        phoneNumber: true,
        nis: true,
        nisn: true,
        updatedAt: true,
      },
    });
  }

  async buildStudentImportTemplate(tenantId: string) {
    const fields = await this.prisma.client.tenantProfileField.findMany({
      where: { tenantId, role: "student", isEnabled: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        label: true,
        options: true,
        validation: true,
        type: true,
      },
    });

    const baseHeaders = ["Nama", "Kelas", "NISN", "Email"];
    const baseRequired = ["Wajib", "Wajib", "Wajib", "Wajib"];

    const customHeaders = fields.map((field) =>
      this.formatFieldHeaderLabel(field),
    );
    const customOptions = fields.map((field) => this.formatFieldOptions(field));
    const customRequired = fields.map((field) =>
      this.isFieldRequired(field) ? "Wajib" : "Opsional",
    );

    const headerRow = [...baseHeaders, ...customHeaders]
      .map((header) => `"${header}"`)
      .join(",");
    const optionsRow = ["", "", "", "", ...customOptions]
      .map((item) => `"${item}"`)
      .join(",");
    const requiredRow = [...baseRequired, ...customRequired]
      .map((item) => `"${item}"`)
      .join(",");
    const exampleRow = [
      "Budi Santoso",
      "X IPA 1",
      "1234567890",
      "budi@sekolah.id",
      ...fields.map(() => ""),
    ]
      .map((item) => `"${item}"`)
      .join(",");

    return [headerRow, optionsRow, requiredRow, exampleRow].join("\r\n");
  }

  async importStudents(
    tenantId: string,
    dto: ImportStudentsDto,
    invitedBy: { sub: string; email: string },
  ): Promise<ImportStudentsResult> {
    const rows = dto.rows ?? [];
    const errors: ImportStudentsError[] = [];

    if (rows.length === 0) {
      return {
        createdCount: 0,
        errors: [
          {
            rowIndex: null,
            field: "general",
            message: "Tidak ada data siswa untuk diimpor.",
          },
        ],
      };
    }

    if (rows.length > 300) {
      return {
        createdCount: 0,
        errors: [
          {
            rowIndex: null,
            field: "general",
            message: "Maksimal 300 baris per impor.",
          },
        ],
      };
    }

    const academicPeriod = await this.prisma.client.academicPeriod.findFirst({
      where: {
        id: dto.academicPeriodId,
        tenantId,
        academicYearId: dto.academicYearId,
      },
      select: { id: true, startDate: true },
    });

    if (!academicPeriod) {
      throw new BadRequestException("Academic period not found");
    }

    const classes = await this.prisma.client.class.findMany({
      where: { tenantId, academicYearId: dto.academicYearId },
      select: { id: true, name: true },
    });

    const customFields = await this.prisma.client.tenantProfileField.findMany({
      where: { tenantId, role: "student", isEnabled: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        label: true,
        type: true,
        options: true,
        validation: true,
      },
    });
    const customFieldMap = new Map(
      customFields.map((field) => [field.id, field]),
    );

    const classMap = new Map<string, string>();
    for (const classItem of classes) {
      if (!classMap.has(classItem.name)) {
        classMap.set(classItem.name, classItem.id);
      }
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedRows = rows.map((row, index) => {
      const name = row.name?.trim() ?? "";
      const email = row.email?.trim().toLowerCase() ?? "";
      const className = row.className?.trim() ?? "";
      const nisn = row.nisn?.trim() ?? "";
      const customValues = row.customFields ?? {};
      return {
        index,
        name,
        email,
        className,
        nisn,
        classId: classMap.get(className) ?? null,
        customFields: customValues,
      };
    });

    const emailCounts = normalizedRows.reduce<Record<string, number>>(
      (acc, row) => {
        if (row.email) {
          acc[row.email] = (acc[row.email] ?? 0) + 1;
        }
        return acc;
      },
      {},
    );

    const nisnCounts = normalizedRows.reduce<Record<string, number>>(
      (acc, row) => {
        if (row.nisn) {
          acc[row.nisn] = (acc[row.nisn] ?? 0) + 1;
        }
        return acc;
      },
      {},
    );

    const customPayloadsByRow = new Map<
      number,
      Array<
        Omit<
          Prisma.StudentProfileFieldValueCreateManyInput,
          "tenantId" | "studentProfileId"
        >
      >
    >();

    for (const row of normalizedRows) {
      const rowIndex = row.index + 1;

      if (!row.name || row.name.length < 2) {
        errors.push({
          rowIndex,
          field: "name",
          message: "Nama wajib diisi minimal 2 karakter.",
        });
      }

      if (!row.email || !emailPattern.test(row.email)) {
        errors.push({
          rowIndex,
          field: "email",
          message: "Email tidak valid.",
        });
      }

      if (!row.className) {
        errors.push({
          rowIndex,
          field: "className",
          message: "Kelas wajib diisi.",
        });
      } else if (!row.classId) {
        errors.push({
          rowIndex,
          field: "className",
          message: "Kelas tidak ditemukan.",
        });
      }

      if (!row.nisn) {
        errors.push({
          rowIndex,
          field: "nisn",
          message: "NISN wajib diisi.",
        });
      } else if (
        !/^\d+$/.test(row.nisn) ||
        row.nisn.length < 10 ||
        row.nisn.length > 13
      ) {
        errors.push({
          rowIndex,
          field: "nisn",
          message: "NISN harus berupa 10-13 digit angka.",
        });
      }

      if (row.email && emailCounts[row.email] > 1) {
        errors.push({
          rowIndex,
          field: "email",
          message: "Email duplikat di dalam file.",
        });
      }

      if (row.nisn && nisnCounts[row.nisn] > 1) {
        errors.push({
          rowIndex,
          field: "nisn",
          message: "NISN duplikat di dalam file.",
        });
      }

      const customPayloads: Array<
        Omit<
          Prisma.StudentProfileFieldValueCreateManyInput,
          "studentProfileId" | "tenantId"
        >
      > = [];
      const customFieldsInput = row.customFields ?? {};

      for (const key of Object.keys(customFieldsInput)) {
        if (!customFieldMap.has(key)) {
          errors.push({
            rowIndex,
            field: key,
            message: "Kolom kustom tidak dikenali.",
          });
        }
      }

      for (const field of customFields) {
        const rawValue = customFieldsInput[field.id] ?? "";
        const parsed = this.parseCustomFieldValue(field, rawValue);
        if (parsed.error) {
          errors.push({
            rowIndex,
            field: field.id,
            message: parsed.error,
          });
          continue;
        }

        if (parsed.payload) {
          customPayloads.push({
            fieldId: field.id,
            ...parsed.payload,
          });
        }
      }

      customPayloadsByRow.set(row.index, customPayloads);
    }

    const uniqueEmails = Object.keys(emailCounts);
    const uniqueNisn = Object.keys(nisnCounts);

    if (uniqueEmails.length > 0) {
      const existingEmails = await this.prisma.client.user.findMany({
        where: { tenantId, email: { in: uniqueEmails } },
        select: { email: true },
      });
      const existingEmailSet = new Set(
        existingEmails.map((item) => item.email),
      );

      for (const row of normalizedRows) {
        if (row.email && existingEmailSet.has(row.email)) {
          errors.push({
            rowIndex: row.index + 1,
            field: "email",
            message: "Email sudah terdaftar.",
          });
        }
      }
    }

    if (uniqueNisn.length > 0) {
      const existingNisn = await this.prisma.client.studentProfile.findMany({
        where: { tenantId, nisn: { in: uniqueNisn } },
        select: { nisn: true },
      });
      const existingNisnSet = new Set(
        existingNisn.map((item) => item.nisn ?? ""),
      );

      for (const row of normalizedRows) {
        if (row.nisn && existingNisnSet.has(row.nisn)) {
          errors.push({
            rowIndex: row.index + 1,
            field: "nisn",
            message: "NISN sudah terdaftar.",
          });
        }
      }
    }

    if (errors.length > 0) {
      return {
        createdCount: 0,
        errors,
      };
    }

    const invitePayloads: Array<{
      email: string;
      name: string;
      token: string;
    }> = [];
    const startDate = academicPeriod.startDate;
    const customValuesToCreate: Prisma.StudentProfileFieldValueCreateManyInput[] =
      [];

    await this.prisma.client.$transaction(async (tx) => {
      for (const row of normalizedRows) {
        const { token, tokenHash, expiresAt } = this.createInviteToken();
        const passwordHash = await argon2.hash(this.createRandomPassword());
        const now = new Date();

        const user = await tx.user.create({
          data: {
            tenantId,
            email: row.email,
            name: row.name,
            passwordHash,
            role: Role.STUDENT,
            status: STATUS_INVITED,
            inviteTokenHash: tokenHash,
            inviteExpiresAt: expiresAt,
            invitedAt: now,
            lastInviteSentAt: now,
            inviteSentCount: 1,
            invitedById: invitedBy.sub,
          },
          select: { id: true, email: true, name: true },
        });

        const profile = await tx.studentProfile.create({
          data: {
            tenantId,
            userId: user.id,
            nisn: row.nisn,
          },
          select: { id: true },
        });

        await tx.classEnrollment.create({
          data: {
            tenantId,
            studentProfileId: profile.id,
            classId: row.classId as string,
            startDate,
          },
        });

        const customPayloads = customPayloadsByRow.get(row.index) ?? [];
        for (const payload of customPayloads) {
          customValuesToCreate.push({
            tenantId,
            studentProfileId: profile.id,
            ...payload,
          });
        }

        invitePayloads.push({
          email: user.email,
          name: user.name,
          token,
        });
      }

      if (customValuesToCreate.length > 0) {
        await tx.studentProfileFieldValue.createMany({
          data: customValuesToCreate,
        });
      }
    });

    for (const invite of invitePayloads) {
      await this.sendInviteEmail(invite);
    }

    return {
      createdCount: invitePayloads.length,
      errors: [],
    };
  }

  private formatFieldHeaderLabel(field: { label: string }) {
    return field.label;
  }

  private formatFieldOptions(field: { options: Prisma.JsonValue | null }) {
    const options =
      (field.options as Array<{ label?: string; value: string }> | null) ?? [];
    if (options.length === 0) {
      return "";
    }
    const labels = options.map((option) => option.label ?? option.value);
    return labels.join(", ");
  }

  private isFieldRequired(field: { validation: Prisma.JsonValue | null }) {
    const validation =
      (field.validation as Record<string, unknown> | null) ?? null;
    return Boolean(validation?.required);
  }

  private resolveOptionValue(
    options: Array<{ label?: string; value: string }>,
    raw: string,
  ) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    const match = options.find(
      (option) => option.value === trimmed || option.label === trimmed,
    );
    return match?.value ?? null;
  }

  private parseCustomFieldValue(
    field: {
      label: string;
      type: string;
      options: Prisma.JsonValue | null;
      validation: Prisma.JsonValue | null;
    },
    rawValue: string,
  ) {
    const validation =
      (field.validation as Record<string, unknown> | null) ?? null;
    const required = Boolean(validation?.required);
    const trimmed = rawValue.trim();

    if (!trimmed) {
      if (required) {
        return { error: `${field.label} wajib diisi.` };
      }
      return { payload: undefined };
    }

    switch (field.type) {
      case "text": {
        const min = validation?.min as number | undefined;
        const max = validation?.max as number | undefined;
        const regex = validation?.regex as string | undefined;
        if (typeof min === "number" && trimmed.length < min) {
          return { error: `${field.label} minimal ${min} karakter.` };
        }
        if (typeof max === "number" && trimmed.length > max) {
          return { error: `${field.label} maksimal ${max} karakter.` };
        }
        if (regex) {
          const pattern = new RegExp(regex);
          if (!pattern.test(trimmed)) {
            return { error: `${field.label} tidak sesuai format.` };
          }
        }
        return { payload: { valueText: trimmed } };
      }
      case "number": {
        const parsed = Number(trimmed);
        if (Number.isNaN(parsed)) {
          return { error: `${field.label} harus berupa angka.` };
        }
        const min = validation?.min as number | undefined;
        const max = validation?.max as number | undefined;
        if (typeof min === "number" && parsed < min) {
          return { error: `${field.label} minimal ${min}.` };
        }
        if (typeof max === "number" && parsed > max) {
          return { error: `${field.label} maksimal ${max}.` };
        }
        return { payload: { valueNumber: parsed } };
      }
      case "date": {
        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) {
          return { error: `${field.label} tanggal tidak valid.` };
        }
        const dateRange = validation?.dateRange as
          | { min?: string; max?: string }
          | undefined;
        if (dateRange?.min) {
          const minDate = new Date(dateRange.min);
          if (parsed < minDate) {
            return { error: `${field.label} lebih kecil dari batas minimum.` };
          }
        }
        if (dateRange?.max) {
          const maxDate = new Date(dateRange.max);
          if (parsed > maxDate) {
            return { error: `${field.label} melebihi batas maksimum.` };
          }
        }
        return { payload: { valueDate: parsed } };
      }
      case "boolean": {
        const normalized = trimmed.toLowerCase();
        const truthy = ["true", "ya", "yes", "1"];
        const falsy = ["false", "tidak", "no", "0"];
        if (truthy.includes(normalized)) {
          return { payload: { valueBoolean: true } };
        }
        if (falsy.includes(normalized)) {
          return { payload: { valueBoolean: false } };
        }
        return { error: `${field.label} harus Ya/Tidak.` };
      }
      case "select": {
        const options =
          (field.options as Array<{ label?: string; value: string }> | null) ??
          [];
        if (options.length === 0) {
          return { payload: { valueSelect: trimmed } };
        }
        const resolved = this.resolveOptionValue(options, trimmed);
        if (!resolved) {
          return { error: `${field.label} tidak sesuai opsi.` };
        }
        return { payload: { valueSelect: resolved } };
      }
      case "multiSelect": {
        const options =
          (field.options as Array<{ label?: string; value: string }> | null) ??
          [];
        const values = trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        if (required && values.length === 0) {
          return { error: `${field.label} wajib diisi.` };
        }
        if (options.length === 0) {
          return { payload: { valueMultiSelect: values } };
        }
        const resolvedValues: string[] = [];
        for (const value of values) {
          const resolved = this.resolveOptionValue(options, value);
          if (!resolved) {
            return { error: `${field.label} tidak sesuai opsi.` };
          }
          resolvedValues.push(resolved);
        }
        return { payload: { valueMultiSelect: resolvedValues } };
      }
      case "file": {
        return { error: `${field.label} tidak mendukung import CSV.` };
      }
      default:
        return { payload: undefined };
    }
  }

  private createInviteToken() {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    return { token, tokenHash, expiresAt };
  }

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private createRandomPassword() {
    return crypto.randomBytes(16).toString("base64url");
  }

  private async sendInviteEmail(params: {
    email: string;
    name: string;
    token: string;
  }) {
    const baseUrl = this.config.get<string>("WEB_APP_URL");
    if (!baseUrl) {
      throw new BadRequestException("WEB_APP_URL is not configured");
    }

    const inviteUrl = `${baseUrl.replace(/\/$/, "")}/auth/accept-invite?token=${encodeURIComponent(
      params.token,
    )}`;

    await this.email.sendInviteEmail({
      to: params.email,
      name: params.name,
      inviteUrl,
      expiresInHours: INVITE_EXPIRY_HOURS,
    });
  }
}
