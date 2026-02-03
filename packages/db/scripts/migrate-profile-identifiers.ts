import "dotenv/config";
import prisma from "../src/client";
import { Gender } from "../src/generated/prisma/enums";

type TenantRole = "student" | "teacher";
type ProfileFieldDefinition = {
  role: TenantRole;
  key: string;
};

const STUDENT_IDENTIFIER_FIELDS: ProfileFieldDefinition[] = [
  { role: "student", key: "nis" },
  { role: "student", key: "nisn" },
];

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toOptionalGender = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  if (normalized === "MALE") return Gender.MALE;
  if (normalized === "FEMALE") return Gender.FEMALE;
  return undefined;
};

async function loadFieldIdMap(tenantId: string, keys: string[]) {
  const fields = await prisma.tenantProfileField.findMany({
    where: {
      tenantId,
      role: { in: ["student", "teacher"] },
      key: { in: keys },
    },
    select: { id: true, role: true, key: true },
  });

  const map = new Map<string, string>();
  for (const field of fields) {
    map.set(`${field.role}:${field.key}`, field.id);
  }

  return map;
}

function assertNoDuplicates(params: {
  tenantId: string;
  values: Array<{
    studentProfileId: string;
    fieldId: string;
    valueText: string | null;
  }>;
  fieldIdMap: Map<string, string>;
}) {
  const { tenantId, values, fieldIdMap } = params;
  const duplicateKeys: string[] = [];
  const seen = new Map<string, string>();

  for (const value of values) {
    const normalized = normalizeValue(value.valueText);
    if (!normalized) continue;
    const key = `${value.fieldId}:${normalized}`;
    const existingStudent = seen.get(key);
    if (existingStudent && existingStudent !== value.studentProfileId) {
      duplicateKeys.push(key);
    } else {
      seen.set(key, value.studentProfileId);
    }
  }

  if (duplicateKeys.length === 0) {
    return;
  }

  const nisFieldId = fieldIdMap.get("student:nis");
  const nisnFieldId = fieldIdMap.get("student:nisn");
  const duplicateSummary = duplicateKeys.map((key) => {
    const [fieldId, valueText] = key.split(":");
    const fieldKey =
      fieldId === nisFieldId
        ? "nis"
        : fieldId === nisnFieldId
          ? "nisn"
          : "unknown";
    return `${fieldKey}:${valueText}`;
  });

  throw new Error(
    `Duplicate student identifiers found for tenant ${tenantId}: ${duplicateSummary.join(", ")}`,
  );
}

async function migrateStudentIdentifiers(
  tenantId: string,
  fieldIdMap: Map<string, string>,
) {
  const nisFieldId = fieldIdMap.get("student:nis");
  const nisnFieldId = fieldIdMap.get("student:nisn");

  if (!nisFieldId && !nisnFieldId) {
    return;
  }

  const targetFieldIds = [nisFieldId, nisnFieldId].filter(
    (fieldId): fieldId is string => Boolean(fieldId),
  );

  const values = await prisma.studentProfileFieldValue.findMany({
    where: {
      tenantId,
      fieldId: { in: targetFieldIds },
    },
    select: {
      studentProfileId: true,
      fieldId: true,
      valueText: true,
    },
  });

  if (values.length === 0) {
    return;
  }

  assertNoDuplicates({ tenantId, values, fieldIdMap });

  const studentMap = new Map<
    string,
    { nis?: string | null; nisn?: string | null }
  >();

  for (const value of values) {
    const current = studentMap.get(value.studentProfileId) ?? {};
    if (value.fieldId === nisFieldId) {
      current.nis = normalizeValue(value.valueText);
    }
    if (value.fieldId === nisnFieldId) {
      current.nisn = normalizeValue(value.valueText);
    }
    studentMap.set(value.studentProfileId, current);
  }

  for (const [studentProfileId, identifiers] of studentMap.entries()) {
    await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: {
        ...(identifiers.nis ? { nis: identifiers.nis } : {}),
        ...(identifiers.nisn ? { nisn: identifiers.nisn } : {}),
      },
    });
  }
}

async function disableStudentIdentifierFields(
  tenantId: string,
  fieldIdMap: Map<string, string>,
) {
  const fieldIds = [
    fieldIdMap.get("student:nis"),
    fieldIdMap.get("student:nisn"),
  ].filter((fieldId): fieldId is string => Boolean(fieldId));

  if (fieldIds.length === 0) return;

  await prisma.tenantProfileField.updateMany({
    where: { tenantId, id: { in: fieldIds } },
    data: { isEnabled: false },
  });
}

async function migrateUserDemographics(tenantId: string) {
  type UserRow = {
    id: string;
    tenantId: string;
    gender: string | null;
    dateOfBirth: Date | null;
    phoneNumber: string | null;
  };

  let users: UserRow[] = [];

  try {
    users = (await prisma.$queryRaw<UserRow[]>`
      SELECT "id", "tenantId", "gender", "dateOfBirth", "phoneNumber"
      FROM "User"
      WHERE "tenantId" = ${tenantId}
    `) as UserRow[];
  } catch (error) {
    console.warn(
      "⚠️  Skipping demographic migration. Columns not found:",
      (error as Error).message,
    );
    return;
  }

  if (users.length === 0) {
    return;
  }

  const userMap = new Map(users.map((user) => [user.id, user]));

  const studentProfiles = await prisma.studentProfile.findMany({
    where: { tenantId },
    select: { id: true, userId: true },
  });

  const teacherProfiles = await prisma.teacherProfile.findMany({
    where: { tenantId },
    select: { id: true, userId: true },
  });

  for (const profile of studentProfiles) {
    const user = userMap.get(profile.userId);
    if (!user) continue;
    const gender = toOptionalGender(user.gender);

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        ...(gender ? { gender } : {}),
        ...(user.dateOfBirth ? { dateOfBirth: user.dateOfBirth } : {}),
        ...(user.phoneNumber ? { phoneNumber: user.phoneNumber } : {}),
      },
    });
  }

  for (const profile of teacherProfiles) {
    const user = userMap.get(profile.userId);
    if (!user) continue;
    const gender = toOptionalGender(user.gender);

    await prisma.teacherProfile.update({
      where: { id: profile.id },
      data: {
        ...(gender ? { gender } : {}),
        ...(user.dateOfBirth ? { dateOfBirth: user.dateOfBirth } : {}),
        ...(user.phoneNumber ? { phoneNumber: user.phoneNumber } : {}),
      },
    });
  }
}

async function migrateProfileIdentifiers() {
  console.log("🚚 Migrating student identifiers and demographics...");

  const tenants = await prisma.tenant.findMany({ select: { id: true } });

  for (const tenant of tenants) {
    console.log(`\n🔧 Processing tenant ${tenant.id}...`);
    const fieldIdMap = await loadFieldIdMap(tenant.id, [
      ...STUDENT_IDENTIFIER_FIELDS.map((field) => field.key),
    ]);

    await migrateStudentIdentifiers(tenant.id, fieldIdMap);
    await disableStudentIdentifierFields(tenant.id, fieldIdMap);
    await migrateUserDemographics(tenant.id);
  }

  console.log("\n✅ Migration finished.");
}

migrateProfileIdentifiers()
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
