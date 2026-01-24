import "dotenv/config";
import prisma from "../src/client";

type IdentifierField = {
  role: "student" | "teacher";
  key: string;
  label: string;
  order: number;
};

const IDENTIFIER_FIELDS: IdentifierField[] = [
  { role: "student", key: "nis", label: "NIS", order: 1 },
  { role: "student", key: "nisn", label: "NISN", order: 2 },
  { role: "teacher", key: "nip", label: "NIP", order: 1 },
  { role: "teacher", key: "nuptk", label: "NUPTK", order: 2 },
];

async function ensureIdentifierFields(tenantId: string) {
  const existing = await prisma.tenantProfileField.findMany({
    where: {
      tenantId,
      role: { in: ["student", "teacher"] },
      key: { in: IDENTIFIER_FIELDS.map((field) => field.key) },
    },
    select: { id: true, role: true, key: true },
  });

  const existingSet = new Set(
    existing.map((field) => `${field.role}:${field.key}`),
  );

  const missing = IDENTIFIER_FIELDS.filter(
    (field) => !existingSet.has(`${field.role}:${field.key}`),
  );

  if (missing.length === 0) {
    return;
  }

  await prisma.tenantProfileField.createMany({
    data: missing.map((field) => ({
      tenantId,
      role: field.role,
      key: field.key,
      label: field.label,
      type: "text",
      validation: { required: false },
      order: field.order,
      isEnabled: true,
    })),
    skipDuplicates: true,
  });
}

async function loadIdentifierFieldIds(tenantId: string) {
  const fields = await prisma.tenantProfileField.findMany({
    where: {
      tenantId,
      role: { in: ["student", "teacher"] },
      key: { in: IDENTIFIER_FIELDS.map((field) => field.key) },
    },
    select: { id: true, role: true, key: true },
  });

  const map = new Map<string, string>();
  for (const field of fields) {
    map.set(`${field.role}:${field.key}`, field.id);
  }

  return map;
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

  type StudentRow = {
    id: string;
    nis: string | null;
    nisn: string | null;
  };

  let rows: StudentRow[] = [];

  try {
    rows = (await prisma.$queryRawUnsafe(
      'SELECT "id", "nis", "nisn" FROM "StudentProfile" WHERE "tenantId" = $1',
      tenantId,
    )) as StudentRow[];
  } catch (error) {
    console.warn(
      "⚠️  Skipping student identifier migration. Columns not found:",
      (error as Error).message,
    );
    return;
  }

  for (const row of rows) {
    if (nisFieldId && row.nis) {
      await prisma.studentProfileFieldValue.upsert({
        where: {
          studentProfileId_fieldId: {
            studentProfileId: row.id,
            fieldId: nisFieldId,
          },
        },
        update: { valueText: row.nis },
        create: {
          tenantId,
          studentProfileId: row.id,
          fieldId: nisFieldId,
          valueText: row.nis,
        },
      });
    }

    if (nisnFieldId && row.nisn) {
      await prisma.studentProfileFieldValue.upsert({
        where: {
          studentProfileId_fieldId: {
            studentProfileId: row.id,
            fieldId: nisnFieldId,
          },
        },
        update: { valueText: row.nisn },
        create: {
          tenantId,
          studentProfileId: row.id,
          fieldId: nisnFieldId,
          valueText: row.nisn,
        },
      });
    }
  }
}

async function migrateTeacherIdentifiers(
  tenantId: string,
  fieldIdMap: Map<string, string>,
) {
  const nipFieldId = fieldIdMap.get("teacher:nip");
  const nuptkFieldId = fieldIdMap.get("teacher:nuptk");

  if (!nipFieldId && !nuptkFieldId) {
    return;
  }

  type TeacherRow = {
    id: string;
    nip: string | null;
    nuptk: string | null;
  };

  let rows: TeacherRow[] = [];

  try {
    rows = (await prisma.$queryRawUnsafe(
      'SELECT "id", "nip", "nuptk" FROM "TeacherProfile" WHERE "tenantId" = $1',
      tenantId,
    )) as TeacherRow[];
  } catch (error) {
    console.warn(
      "⚠️  Skipping teacher identifier migration. Columns not found:",
      (error as Error).message,
    );
    return;
  }

  for (const row of rows) {
    if (nipFieldId && row.nip) {
      await prisma.teacherProfileFieldValue.upsert({
        where: {
          teacherProfileId_fieldId: {
            teacherProfileId: row.id,
            fieldId: nipFieldId,
          },
        },
        update: { valueText: row.nip },
        create: {
          tenantId,
          teacherProfileId: row.id,
          fieldId: nipFieldId,
          valueText: row.nip,
        },
      });
    }

    if (nuptkFieldId && row.nuptk) {
      await prisma.teacherProfileFieldValue.upsert({
        where: {
          teacherProfileId_fieldId: {
            teacherProfileId: row.id,
            fieldId: nuptkFieldId,
          },
        },
        update: { valueText: row.nuptk },
        create: {
          tenantId,
          teacherProfileId: row.id,
          fieldId: nuptkFieldId,
          valueText: row.nuptk,
        },
      });
    }
  }
}

async function migrateProfileIdentifiers() {
  console.log("🚚 Migrating profile identifiers to custom fields...");

  const tenants = await prisma.tenant.findMany({ select: { id: true } });

  for (const tenant of tenants) {
    console.log(`\n🔧 Processing tenant ${tenant.id}...`);
    await ensureIdentifierFields(tenant.id);
    const fieldIdMap = await loadIdentifierFieldIds(tenant.id);
    await migrateStudentIdentifiers(tenant.id, fieldIdMap);
    await migrateTeacherIdentifiers(tenant.id, fieldIdMap);
  }

  console.log("\n✅ Identifier migration finished.");
}

migrateProfileIdentifiers()
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
