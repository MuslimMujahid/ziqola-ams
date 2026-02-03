import process from "node:process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as argon2 from "argon2";
import { prisma } from "../src/client";
import {
  Role,
  AcademicStatus,
  PeriodStatus,
  GroupType,
  UserStatus,
  AttendanceStatus,
  Gender,
} from "../src/generated/prisma/enums";
import { Prisma } from "../src/generated/prisma/client";
import type { TenantProfileField } from "../src/generated/prisma/client";

type TemplateFieldOption = {
  label: string;
  value: string;
  order?: number;
};

type TemplateField = {
  key: string;
  label: string;
  type: string;
  helpText?: string | null;
  options?: TemplateFieldOption[] | null;
  validation?: Record<string, unknown> | null;
  order?: number | null;
  isEnabled?: boolean | null;
};

type ProfileTemplate = {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  profile: {
    customFields: {
      student: TemplateField[];
      teacher: TemplateField[];
    };
  };
};

type CsvRow = Record<string, string>;

const resolveBasicTemplatePath = () => {
  const cwd = process.cwd();
  const candidates = [
    path.join(
      cwd,
      "apps",
      "backend",
      "src",
      "configurations",
      "templates",
      "basic.json",
    ),
    path.join(
      cwd,
      "..",
      "..",
      "apps",
      "backend",
      "src",
      "configurations",
      "templates",
      "basic.json",
    ),
  ];

  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error("Basic template file not found");
  }

  return resolved;
};

const loadBasicTemplate = async () => {
  const templatePath = resolveBasicTemplatePath();
  const raw = await readFile(templatePath, "utf-8");
  return JSON.parse(raw) as ProfileTemplate;
};

const parseOptionValues = (options?: Prisma.JsonValue | null) => {
  if (!options || !Array.isArray(options)) return [] as string[];
  return options
    .map((option) => {
      if (typeof option === "string") return option;
      if (option && typeof option === "object") {
        const value = (option as { value?: unknown; label?: unknown }).value;
        if (typeof value === "string") return value;
        const label = (option as { label?: unknown }).label;
        return typeof label === "string" ? label : "";
      }
      return "";
    })
    .filter((value) => Boolean(value));
};

const buildFieldValuePayload = (
  field: TenantProfileField,
  index: number,
  baseDate: Date,
) => {
  const optionValues = parseOptionValues(field.options);

  switch (field.type) {
    case "text":
      return { valueText: `${field.label} ${index + 1}` };
    case "number":
      return { valueNumber: 60 + (index % 40) };
    case "date": {
      const date = new Date(baseDate);
      date.setMonth(index % 12);
      date.setDate(1 + (index % 28));
      return { valueDate: date };
    }
    case "boolean":
      return { valueBoolean: index % 2 === 0 };
    case "select":
      return {
        valueSelect: optionValues[index % optionValues.length] ?? "Pilihan 1",
      };
    case "multiSelect":
      return {
        valueMultiSelect:
          optionValues.length > 0
            ? optionValues.slice(0, Math.min(2, optionValues.length))
            : [],
      };
    case "file":
      return {
        valueFile: {
          name: "dokumen.pdf",
          url: "https://example.com/dokumen.pdf",
          size: 256000,
          mimeType: "application/pdf",
        } as Prisma.InputJsonValue,
      };
    default:
      return { valueText: `${field.label} ${index + 1}` };
  }
};

const resolveSeedDataPath = () => {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "packages", "db", "data", "seed"),
    path.join(cwd, "prisma", "data", "seed"),
    path.join(cwd, "data", "seed"),
    path.join(cwd, "..", "..", "packages", "db", "data", "seed"),
  ];

  const resolved = candidates.find((candidate) =>
    existsSync(path.join(candidate, "tenant.csv")),
  );

  if (!resolved) {
    throw new Error("Seed data folder not found. Generate CSVs first.");
  }

  return resolved;
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const ensureHeaders = (
  headers: string[],
  required: string[],
  fileName: string,
) => {
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`Missing headers in ${fileName}: ${missing.join(", ")}`);
  }
};

const loadCsv = async (filePath: string, requiredHeaders: string[]) => {
  const raw = await readFile(filePath, "utf-8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [] as CsvRow[];

  const header = parseCsvLine(lines[0]);
  ensureHeaders(header, requiredHeaders, filePath);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: CsvRow = {};
    header.forEach((key, index) => {
      row[key] = values[index] ?? "";
    });
    return row;
  });
};

const toOptional = (value?: string | null) =>
  value && value.length > 0 ? value : null;

const toOptionalGender = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  if (normalized === "MALE") return Gender.MALE;
  if (normalized === "FEMALE") return Gender.FEMALE;
  return undefined;
};

const toOptionalInt = (value?: string | null) => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toOptionalDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toOptionalBoolean = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
};

const toOptionalJson = (value?: string | null) => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
};

const collectMissingIds = (
  rows: CsvRow[],
  key: string,
  reference: Set<string>,
) => {
  const missing = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (value && !reference.has(value)) {
      missing.add(value);
    }
  }
  return Array.from(missing);
};

const collectDuplicateIds = (
  rows: CsvRow[],
  key: string,
  options?: { allowBlank?: boolean },
) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const allowBlank = options?.allowBlank ?? false;
  for (const row of rows) {
    const value = row[key];
    if (!value && allowBlank) continue;
    if (!value) {
      duplicates.add("");
      continue;
    }
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }
  return Array.from(duplicates);
};

const CSV_HEADERS = {
  tenant: ["id", "name", "slug", "education_level", "active_academic_year_id"],
  academicYear: [
    "id",
    "tenant_id",
    "label",
    "status",
    "start_date",
    "end_date",
    "active_period_id",
  ],
  academicPeriod: [
    "id",
    "tenant_id",
    "academic_year_id",
    "name",
    "start_date",
    "end_date",
    "order_index",
    "status",
  ],
  user: ["id", "tenant_id", "email", "name", "role", "status"],
  teacherProfile: ["id", "tenant_id", "user_id", "hired_at"],
  studentProfile: ["id", "tenant_id", "user_id"],
  group: ["id", "tenant_id", "name", "type"],
  class: ["id", "tenant_id", "academic_year_id", "name"],
  classGroup: ["tenant_id", "class_id", "group_id"],
  homeroomAssignment: [
    "id",
    "tenant_id",
    "class_id",
    "academic_year_id",
    "teacher_profile_id",
    "assigned_at",
    "ended_at",
    "is_active",
  ],
  subject: ["id", "tenant_id", "name", "is_deleted", "deleted_at"],
  classSubject: [
    "id",
    "tenant_id",
    "class_id",
    "academic_year_id",
    "subject_id",
    "teacher_profile_id",
    "is_deleted",
    "deleted_at",
  ],
  teacherSubject: ["id", "tenant_id", "teacher_profile_id", "subject_id"],
  classEnrollment: [
    "id",
    "tenant_id",
    "class_id",
    "student_profile_id",
    "start_date",
    "end_date",
  ],
  tenantAssessmentType: [
    "id",
    "tenant_id",
    "key",
    "label",
    "description",
    "order",
    "is_enabled",
  ],
  assessmentTypeWeight: [
    "id",
    "tenant_id",
    "teacher_subject_id",
    "academic_period_id",
    "assessment_type_id",
    "weight",
  ],
  assessmentComponent: [
    "id",
    "tenant_id",
    "class_subject_id",
    "academic_period_id",
    "assessment_type_id",
    "name",
    "weight",
  ],
  assessmentScore: [
    "id",
    "tenant_id",
    "component_id",
    "student_profile_id",
    "score",
    "is_locked",
    "locked_at",
  ],
  attendance: [
    "id",
    "tenant_id",
    "session_id",
    "student_profile_id",
    "status",
    "remarks",
  ],
  schedule: [
    "id",
    "tenant_id",
    "class_id",
    "academic_period_id",
    "class_subject_id",
    "teacher_profile_id",
    "day_of_week",
    "start_time",
    "end_time",
  ],
  session: [
    "id",
    "tenant_id",
    "class_id",
    "academic_period_id",
    "class_subject_id",
    "schedule_id",
    "date",
    "start_time",
    "end_time",
  ],
};

async function main() {
  console.log("🌱 Starting database seed from CSV...\n");

  const seedDir = resolveSeedDataPath();
  console.log(`📂 Using seed data from: ${seedDir}`);
  const load = (fileName: string, headers: string[]) =>
    loadCsv(path.join(seedDir, `${fileName}.csv`), headers);

  const tenantRows = await load("tenant", CSV_HEADERS.tenant);
  if (tenantRows.length === 0) {
    throw new Error("tenant.csv is empty. Generate seed data first.");
  }

  const tenantSlug = tenantRows[0].slug;
  const existingTenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug },
  });

  if (existingTenant) {
    console.log("⚠️  Seed data already exists. Skipping...");
    return;
  }

  const academicYearRows = await load(
    "academic_year",
    CSV_HEADERS.academicYear,
  );
  const academicPeriodRows = await load(
    "academic_period",
    CSV_HEADERS.academicPeriod,
  );
  const userRows = await load("user", CSV_HEADERS.user);
  const teacherProfileRows = await load(
    "teacher_profile",
    CSV_HEADERS.teacherProfile,
  );
  const studentProfileRows = await load(
    "student_profile",
    CSV_HEADERS.studentProfile,
  );
  const groupRows = await load("group", CSV_HEADERS.group);
  const classRows = await load("class", CSV_HEADERS.class);
  const classGroupRows = await load("class_group", CSV_HEADERS.classGroup);
  const homeroomRows = await load(
    "homeroom_assignment",
    CSV_HEADERS.homeroomAssignment,
  );
  const subjectRows = await load("subject", CSV_HEADERS.subject);
  const classSubjectRows = await load(
    "class_subject",
    CSV_HEADERS.classSubject,
  );
  const teacherSubjectRows = await load(
    "teacher_subject",
    CSV_HEADERS.teacherSubject,
  );
  const scheduleRows = await load("schedule", CSV_HEADERS.schedule);
  const sessionRows = await load("session", CSV_HEADERS.session);
  const classEnrollmentRows = await load(
    "class_enrollment",
    CSV_HEADERS.classEnrollment,
  );
  const tenantAssessmentTypeRows = await load(
    "tenant_assessment_type",
    CSV_HEADERS.tenantAssessmentType,
  );
  const assessmentTypeWeightRows = await load(
    "assessment_type_weight",
    CSV_HEADERS.assessmentTypeWeight,
  );
  const assessmentComponentRows = await load(
    "assessment_component",
    CSV_HEADERS.assessmentComponent,
  );
  const assessmentScoreRows = await load(
    "assessment_score",
    CSV_HEADERS.assessmentScore,
  );
  const attendanceRows = await load("attendance", CSV_HEADERS.attendance);

  const duplicateStudentIds = collectDuplicateIds(studentProfileRows, "id");
  if (duplicateStudentIds.length > 0) {
    throw new Error(
      `student_profile.csv has duplicate id values. Example: ${duplicateStudentIds.slice(0, 3).join(", ")}`,
    );
  }

  const duplicateStudentUserIds = collectDuplicateIds(
    studentProfileRows,
    "user_id",
  );
  if (duplicateStudentUserIds.length > 0) {
    throw new Error(
      `student_profile.csv has duplicate user_id values. Example: ${duplicateStudentUserIds.slice(0, 3).join(", ")}`,
    );
  }

  const duplicateStudentNis = collectDuplicateIds(studentProfileRows, "nis", {
    allowBlank: true,
  });
  if (duplicateStudentNis.length > 0) {
    throw new Error(
      `student_profile.csv has duplicate nis values. Example: ${duplicateStudentNis.slice(0, 3).join(", ")}`,
    );
  }

  const duplicateStudentNisn = collectDuplicateIds(studentProfileRows, "nisn", {
    allowBlank: true,
  });
  if (duplicateStudentNisn.length > 0) {
    throw new Error(
      `student_profile.csv has duplicate nisn values. Example: ${duplicateStudentNisn.slice(0, 3).join(", ")}`,
    );
  }

  const studentProfileIds = new Set(studentProfileRows.map((row) => row.id));
  const classIds = new Set(classRows.map((row) => row.id));

  const missingEnrollmentStudents = collectMissingIds(
    classEnrollmentRows,
    "student_profile_id",
    studentProfileIds,
  );
  if (missingEnrollmentStudents.length > 0) {
    throw new Error(
      `class_enrollment.csv references ${missingEnrollmentStudents.length} missing student_profile_id values. Example: ${missingEnrollmentStudents.slice(0, 3).join(", ")}`,
    );
  }

  const missingEnrollmentClasses = collectMissingIds(
    classEnrollmentRows,
    "class_id",
    classIds,
  );
  if (missingEnrollmentClasses.length > 0) {
    throw new Error(
      `class_enrollment.csv references ${missingEnrollmentClasses.length} missing class_id values. Example: ${missingEnrollmentClasses.slice(0, 3).join(", ")}`,
    );
  }

  console.log("📦 Creating tenant...");
  await prisma.tenant.createMany({
    data: tenantRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      educationLevel: toOptional(row.education_level),
    })),
  });

  console.log("📅 Creating academic years and periods...");
  await prisma.academicYear.createMany({
    data: academicYearRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      label: row.label,
      status: row.status as AcademicStatus,
      startDate: toOptionalDate(row.start_date),
      endDate: toOptionalDate(row.end_date),
    })),
  });

  await prisma.academicPeriod.createMany({
    data: academicPeriodRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      academicYearId: row.academic_year_id,
      name: row.name,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      orderIndex: Number.parseInt(row.order_index, 10),
      status: row.status as PeriodStatus,
    })),
  });

  for (const row of academicYearRows) {
    if (!row.active_period_id) continue;
    await prisma.academicYear.update({
      where: { id: row.id },
      data: { activePeriodId: row.active_period_id },
    });
  }

  for (const row of tenantRows) {
    if (!row.active_academic_year_id) continue;
    await prisma.tenant.update({
      where: { id: row.id },
      data: { activeAcademicYearId: row.active_academic_year_id },
    });
  }

  console.log("👥 Creating users and profiles...");
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ?? "password123";
  const defaultPasswordHash = await argon2.hash(defaultPassword);

  const userRowMap = new Map(userRows.map((row) => [row.id, row]));

  await prisma.user.createMany({
    data: userRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      name: row.name,
      passwordHash: defaultPasswordHash,
      role: row.role as Role,
      status: (row.status as UserStatus) ?? UserStatus.ACTIVE,
    })),
    skipDuplicates: true,
  });

  await prisma.teacherProfile.createMany({
    data: teacherProfileRows.map((row) => ({
      ...(function resolveTeacherDemographics() {
        const userRow = userRowMap.get(row.user_id);
        const gender =
          toOptionalGender(row.gender) ?? toOptionalGender(userRow?.gender);
        const dateOfBirth =
          toOptionalDate(row.date_of_birth) ??
          toOptionalDate(userRow?.date_of_birth);
        const phoneNumber =
          toOptional(row.phone_number) ?? toOptional(userRow?.phone_number);
        return {
          gender: gender ?? undefined,
          dateOfBirth: dateOfBirth ?? undefined,
          phoneNumber: phoneNumber ?? undefined,
        };
      })(),
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      hiredAt: toOptionalDate(row.hired_at),
      additionalIdentifiers: toOptionalJson(row.additional_identifiers),
    })),
    skipDuplicates: true,
  });

  await prisma.studentProfile.createMany({
    data: studentProfileRows.map((row) => ({
      ...(function resolveStudentDemographics() {
        const userRow = userRowMap.get(row.user_id);
        const gender =
          toOptionalGender(row.gender) ?? toOptionalGender(userRow?.gender);
        const dateOfBirth =
          toOptionalDate(row.date_of_birth) ??
          toOptionalDate(userRow?.date_of_birth);
        const phoneNumber =
          toOptional(row.phone_number) ?? toOptional(userRow?.phone_number);
        return {
          gender: gender ?? undefined,
          dateOfBirth: dateOfBirth ?? undefined,
          phoneNumber: phoneNumber ?? undefined,
        };
      })(),
      ...(function resolveStudentIdentifiers() {
        const identifiers = toOptionalJson(row.additional_identifiers) as
          | { nis?: string; nisn?: string }
          | undefined;
        const nis = toOptional(row.nis) ?? identifiers?.nis;
        const nisn = toOptional(row.nisn) ?? identifiers?.nisn;
        return {
          nis: nis ?? undefined,
          nisn: nisn ?? undefined,
        };
      })(),
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
    })),
    skipDuplicates: true,
  });

  console.log("🏫 Creating groups and classes...");
  await prisma.group.createMany({
    data: groupRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      type: row.type as GroupType,
    })),
    skipDuplicates: true,
  });

  await prisma.class.createMany({
    data: classRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      academicYearId: row.academic_year_id,
      name: row.name,
    })),
    skipDuplicates: true,
  });

  await prisma.classGroup.createMany({
    data: classGroupRows.map((row) => ({
      tenantId: row.tenant_id,
      classId: row.class_id,
      groupId: row.group_id,
    })),
    skipDuplicates: true,
  });

  console.log("👨‍🏫 Creating homeroom assignments...");
  if (homeroomRows.length > 0) {
    await prisma.homeroomAssignment.createMany({
      data: homeroomRows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        classId: row.class_id,
        academicYearId: row.academic_year_id,
        teacherProfileId: row.teacher_profile_id,
        assignedAt: toOptionalDate(row.assigned_at) ?? new Date(),
        endedAt: toOptionalDate(row.ended_at),
        isActive: toOptionalBoolean(row.is_active) ?? true,
      })),
      skipDuplicates: true,
    });
  }

  console.log("📚 Creating subjects and class subjects...");
  await prisma.subject.createMany({
    data: subjectRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      isDeleted: toOptionalBoolean(row.is_deleted) ?? false,
      deletedAt: toOptionalDate(row.deleted_at),
    })),
    skipDuplicates: true,
  });

  await prisma.classSubject.createMany({
    data: classSubjectRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      classId: row.class_id,
      academicYearId: row.academic_year_id,
      subjectId: row.subject_id,
      teacherProfileId: row.teacher_profile_id,
      isDeleted: toOptionalBoolean(row.is_deleted) ?? false,
      deletedAt: toOptionalDate(row.deleted_at),
    })),
    skipDuplicates: true,
  });

  if (teacherSubjectRows.length > 0) {
    await prisma.teacherSubject.createMany({
      data: teacherSubjectRows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        teacherProfileId: row.teacher_profile_id,
        subjectId: row.subject_id,
      })),
      skipDuplicates: true,
    });
  }

  console.log("🗓️  Creating schedules...");
  if (scheduleRows.length > 0) {
    await prisma.schedule.createMany({
      data: scheduleRows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        classId: row.class_id,
        academicPeriodId: row.academic_period_id,
        classSubjectId: row.class_subject_id,
        teacherProfileId: row.teacher_profile_id,
        dayOfWeek: Number.parseInt(row.day_of_week, 10),
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
      })),
      skipDuplicates: true,
    });
  }

  console.log("🧾 Creating sessions...");
  if (sessionRows.length > 0) {
    await prisma.session.createMany({
      data: sessionRows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        classId: row.class_id,
        academicPeriodId: toOptional(row.academic_period_id) ?? undefined,
        classSubjectId: row.class_subject_id,
        scheduleId: toOptional(row.schedule_id) ?? undefined,
        date: new Date(row.date),
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
      })),
      skipDuplicates: true,
    });
  }

  console.log("📝 Creating enrollments...");
  await prisma.classEnrollment.createMany({
    data: classEnrollmentRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      classId: row.class_id,
      studentProfileId: row.student_profile_id,
      startDate: new Date(row.start_date),
      endDate: toOptionalDate(row.end_date),
    })),
    skipDuplicates: true,
  });

  console.log(
    "🧪 Creating assessment types, weights, components, and scores...",
  );
  await prisma.tenantAssessmentType.createMany({
    data: tenantAssessmentTypeRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      key: row.key,
      label: row.label,
      description: toOptional(row.description),
      order: toOptionalInt(row.order),
      isEnabled: toOptionalBoolean(row.is_enabled) ?? true,
    })),
    skipDuplicates: true,
  });

  await prisma.assessmentTypeWeight.createMany({
    data: assessmentTypeWeightRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      teacherSubjectId: row.teacher_subject_id,
      academicPeriodId: row.academic_period_id,
      assessmentTypeId: row.assessment_type_id,
      weight: Number.parseInt(row.weight, 10),
    })),
    skipDuplicates: true,
  });

  await prisma.assessmentComponent.createMany({
    data: assessmentComponentRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      classSubjectId: row.class_subject_id,
      academicPeriodId: row.academic_period_id,
      assessmentTypeId: row.assessment_type_id,
      name: row.name,
      weight: Number.parseInt(row.weight, 10),
    })),
    skipDuplicates: true,
  });

  await prisma.assessmentScore.createMany({
    data: assessmentScoreRows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      componentId: row.component_id,
      studentProfileId: row.student_profile_id,
      score: new Prisma.Decimal(row.score),
      isLocked: toOptionalBoolean(row.is_locked) ?? false,
      lockedAt: toOptionalDate(row.locked_at),
    })),
    skipDuplicates: true,
  });

  if (attendanceRows.length > 0) {
    console.log("🧷 Creating attendance records...");
    await prisma.attendance.createMany({
      data: attendanceRows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        sessionId: row.session_id,
        studentProfileId: row.student_profile_id,
        status: row.status as AttendanceStatus,
        remarks: toOptional(row.remarks),
      })),
      skipDuplicates: true,
    });
  }

  console.log("🧩 Applying basic profile template...");
  const template = await loadBasicTemplate();
  const studentFields = template.profile.customFields.student;
  const teacherFields = template.profile.customFields.teacher;

  const buildFieldSeeds = (
    role: "student" | "teacher",
    fields: TemplateField[],
  ) =>
    fields.map((field) => ({
      tenantId: tenantRows[0].id,
      role,
      key: field.key,
      label: field.label,
      type: field.type,
      helpText: field.helpText ?? undefined,
      options: field.options
        ? (field.options as Prisma.InputJsonValue)
        : undefined,
      validation: field.validation
        ? (field.validation as Prisma.InputJsonValue)
        : undefined,
      order: field.order ?? undefined,
      isEnabled: field.isEnabled ?? true,
      sourceTemplateId: template.id,
    }));

  const templateFields = [
    ...buildFieldSeeds("student", studentFields),
    ...buildFieldSeeds("teacher", teacherFields),
  ];

  if (templateFields.length > 0) {
    await prisma.tenantProfileField.createMany({
      data: templateFields,
      skipDuplicates: true,
    });
  }

  const tenantProfileFields = await prisma.tenantProfileField.findMany({
    where: { tenantId: tenantRows[0].id, isEnabled: true },
  });

  const studentFieldsForValues = tenantProfileFields.filter(
    (field) => field.role === "student",
  );
  const teacherFieldsForValues = tenantProfileFields.filter(
    (field) => field.role === "teacher",
  );

  const teacherIdentifierMap = new Map(
    teacherProfileRows.map((row) => [
      row.id,
      toOptionalJson(row.additional_identifiers) as
        | { nip?: string; nuptk?: string }
        | undefined,
    ]),
  );

  const studentValueSeeds = studentProfileRows.flatMap((student, index) =>
    studentFieldsForValues.map((field) => ({
      tenantId: tenantRows[0].id,
      studentProfileId: student.id,
      fieldId: field.id,
      ...buildFieldValuePayload(field, index, new Date(2010, 0, 1)),
    })),
  );

  const teacherValueSeeds = teacherProfileRows.flatMap((teacher, index) =>
    teacherFieldsForValues.map((field) => {
      const identifiers = teacherIdentifierMap.get(teacher.id);

      return {
        tenantId: tenantRows[0].id,
        teacherProfileId: teacher.id,
        fieldId: field.id,
        ...(field.key === "nip"
          ? { valueText: identifiers?.nip }
          : field.key === "nuptk"
            ? { valueText: identifiers?.nuptk }
            : buildFieldValuePayload(field, index, new Date(1985, 0, 1))),
      };
    }),
  );

  if (studentValueSeeds.length > 0) {
    await prisma.studentProfileFieldValue.createMany({
      data: studentValueSeeds,
      skipDuplicates: true,
    });
  }

  if (teacherValueSeeds.length > 0) {
    await prisma.teacherProfileFieldValue.createMany({
      data: teacherValueSeeds,
      skipDuplicates: true,
    });
  }

  console.log("✨ Seed completed successfully!\n");
  console.log("📋 Summary:");
  console.log(`   - Tenant: ${tenantRows[0].name}`);
  console.log(`   - Users: ${userRows.length} total`);
  console.log(`   - Academic Years: ${academicYearRows.length}`);
  console.log(`   - Subjects: ${subjectRows.length}`);
  console.log(`   - Classes: ${classRows.length}`);
  console.log(`\n🔐 Default password for all users: ${defaultPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
