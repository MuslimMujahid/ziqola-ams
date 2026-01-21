import process from "node:process";
import { prisma } from "../src/client";
import * as argon2 from "argon2";
import {
  Role,
  AcademicStatus,
  PeriodStatus,
  Gender,
  GroupType,
} from "../src/generated/prisma/enums";

/**
 * Seed script for Ziqola AMS
 *
 * Creates initial data for development and testing:
 * - Demo tenant with users (Principal, Admin, Teachers, Students)
 * - Academic year with periods
 * - Subjects, classes, and enrollments
 * - Groups (grades/streams)
 *
 * Run with: pnpm --filter backend prisma:seed
 */

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Check if seed already exists
  const existingTenant = await prisma.tenant.findFirst({
    where: { name: "Demo School" },
  });

  if (existingTenant) {
    console.log("⚠️  Seed data already exists. Skipping...");
    return;
  }

  // 1. Create tenant
  console.log("📦 Creating tenant...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo School",
      slug: "demo-school",
      educationLevel: "SMA",
    },
  });
  console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})\n`);
  console.log(`   Tenant slug: ${tenant.slug}\n`);

  // 2. Create users with different roles
  console.log("👥 Creating users...");

  const defaultPassword = await argon2.hash("password123");

  // Principal
  const principal = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "principal@demo.school",
      name: "Dr. Sarah Principal",
      passwordHash: defaultPassword,
      role: Role.PRINCIPAL,
      gender: Gender.FEMALE,
      phoneNumber: "+62-812-3456-7890",
    },
  });
  console.log(`✅ Created principal: ${principal.email}`);

  // Admin staff
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@demo.school",
      name: "John Admin",
      passwordHash: defaultPassword,
      role: Role.ADMIN_STAFF,
      gender: Gender.MALE,
      phoneNumber: "+62-813-4567-8901",
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // Teachers
  const teachers = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "teacher1@demo.school",
        name: "Siti Nurhayati",
        passwordHash: defaultPassword,
        role: Role.TEACHER,
        gender: Gender.FEMALE,
        teacherProfile: {
          create: {
            tenantId: tenant.id,
            nip: "198501012010012001",
            nuptk: "1234567890123456",
            hiredAt: new Date("2010-01-01"),
          },
        },
      },
      include: { teacherProfile: true },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "teacher2@demo.school",
        name: "Budi Santoso",
        passwordHash: defaultPassword,
        role: Role.TEACHER,
        gender: Gender.MALE,
        teacherProfile: {
          create: {
            tenantId: tenant.id,
            nip: "198601012010012002",
            nuptk: "1234567890123457",
            hiredAt: new Date("2011-01-01"),
          },
        },
      },
      include: { teacherProfile: true },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "teacher3@demo.school",
        name: "Rina Handayani",
        passwordHash: defaultPassword,
        role: Role.TEACHER,
        gender: Gender.FEMALE,
        teacherProfile: {
          create: {
            tenantId: tenant.id,
            nip: "198701012012012003",
            nuptk: "1234567890123458",
            hiredAt: new Date("2012-01-01"),
          },
        },
      },
      include: { teacherProfile: true },
    }),
  ]);
  console.log(`✅ Created ${teachers.length} teachers\n`);

  // Students
  console.log("🎓 Creating students...");
  const studentNames = [
    "Ahmad Fauzi",
    "Nadia Aulia",
    "Rizky Pratama",
    "Dewi Lestari",
    "Fajar Hidayat",
    "Intan Permata",
    "Ilham Ramadhan",
    "Putri Amelia",
    "Bagas Saputra",
    "Salsabila Nur",
  ];
  const students = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const num = (i + 1).toString().padStart(3, "0");
      return prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `student${num}@demo.school`,
          name: studentNames[i] ?? `Siswa ${num}`,
          passwordHash: defaultPassword,
          role: Role.STUDENT,
          gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          dateOfBirth: new Date(2010 + (i % 3), i % 12, 15),
          studentProfile: {
            create: {
              tenantId: tenant.id,
              nis: `202400${num}`,
              nisn: `00${num}0000000`,
            },
          },
        },
        include: { studentProfile: true },
      });
    }),
  );
  console.log(`✅ Created ${students.length} students\n`);

  // 3. Create academic year with periods
  console.log("📅 Creating academic year...");
  const today = new Date();
  const currentYear = today.getFullYear();
  const academicYearStartYear =
    today.getMonth() >= 6 ? currentYear : currentYear - 1;
  const academicYearEndYear = academicYearStartYear + 1;
  const academicYear = await prisma.academicYear.create({
    data: {
      tenantId: tenant.id,
      label: `${academicYearStartYear}/${academicYearEndYear}`,
      status: AcademicStatus.ACTIVE,
      startDate: new Date(`${academicYearStartYear}-07-01`),
      endDate: new Date(`${academicYearEndYear}-06-30`),
      periods: {
        create: [
          {
            tenantId: tenant.id,
            name: "Semester 1",
            startDate: new Date(`${academicYearStartYear}-07-01`),
            endDate: new Date(`${academicYearStartYear}-12-31`),
            orderIndex: 1,
            status: PeriodStatus.DRAFT,
          },
          {
            tenantId: tenant.id,
            name: "Semester 2",
            startDate: new Date(`${academicYearEndYear}-01-01`),
            endDate: new Date(`${academicYearEndYear}-06-30`),
            orderIndex: 2,
            status: PeriodStatus.DRAFT,
          },
        ],
      },
    },
    include: { periods: true },
  });

  const activePeriod =
    academicYear.periods.find(
      (period) =>
        today >= period.startDate && today <= (period.endDate ?? today),
    ) ?? academicYear.periods[0];

  // Set active period
  await prisma.academicYear.update({
    where: { id: academicYear.id },
    data: { activePeriodId: activePeriod.id },
  });
  console.log(`✅ Created academic year: ${academicYear.label}`);
  console.log(`   - ${academicYear.periods.length} periods created\n`);

  // Set this year as active for tenant
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { activeAcademicYearId: academicYear.id },
  });

  // 4. Create subjects
  console.log("📚 Creating subjects...");
  const subjectNames = [
    "Matematika",
    "Bahasa Inggris",
    "Bahasa Indonesia",
    "IPA",
    "IPS",
    "PJOK",
    "Seni Budaya",
    "Pendidikan Agama",
  ];

  const subjects = await Promise.all(
    subjectNames.map((name) =>
      prisma.subject.create({
        data: {
          tenantId: tenant.id,
          name,
        },
      }),
    ),
  );
  console.log(`✅ Created ${subjects.length} subjects\n`);

  // 5. Create groups (grades)
  console.log("🏫 Creating groups...");
  const gradeNames = getDefaultGrades(tenant.educationLevel ?? "SMA");
  const grades = await Promise.all(
    gradeNames.map((name) =>
      prisma.group.create({
        data: {
          tenantId: tenant.id,
          name,
          type: GroupType.GRADE,
        },
      }),
    ),
  );

  const streams = await Promise.all(
    ["IPA", "IPS"].map((name) =>
      prisma.group.create({
        data: {
          tenantId: tenant.id,
          name,
          type: GroupType.STREAM,
        },
      }),
    ),
  );
  console.log(
    `✅ Created ${grades.length} grades and ${streams.length} streams\n`,
  );

  // 6. Create classes
  console.log("🎒 Creating classes...");
  const class10A = await prisma.class.create({
    data: {
      tenantId: tenant.id,
      academicYearId: academicYear.id,
      name: "X IPA 1",
      classGroups: {
        create: [
          { tenantId: tenant.id, groupId: grades[0].id }, // Grade 10
          { tenantId: tenant.id, groupId: streams[0].id }, // Science
        ],
      },
    },
  });

  const class10B = await prisma.class.create({
    data: {
      tenantId: tenant.id,
      academicYearId: academicYear.id,
      name: "X IPS 1",
      classGroups: {
        create: [
          { tenantId: tenant.id, groupId: grades[0].id }, // Grade 10
          { tenantId: tenant.id, groupId: streams[1].id }, // Social
        ],
      },
    },
  });
  console.log(`✅ Created classes: ${class10A.name}, ${class10B.name}\n`);

  // 7. Assign homeroom teachers
  console.log("👨‍🏫 Assigning homeroom teachers...");
  await Promise.all([
    prisma.homeroomAssignment.create({
      data: {
        tenantId: tenant.id,
        classId: class10A.id,
        academicYearId: academicYear.id,
        teacherProfileId: teachers[0].teacherProfile!.id,
        isActive: true,
      },
    }),
    prisma.homeroomAssignment.create({
      data: {
        tenantId: tenant.id,
        classId: class10B.id,
        academicYearId: academicYear.id,
        teacherProfileId: teachers[1].teacherProfile!.id,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Homeroom teachers assigned\n`);

  // 8. Create class subjects (assign subjects to classes with teachers)
  console.log("📖 Creating class subjects...");

  // Assign first 4 subjects to class 10-A
  const class10ASubjects = await Promise.all(
    subjects.slice(0, 4).map((subject, index) =>
      prisma.classSubject.create({
        data: {
          tenantId: tenant.id,
          classId: class10A.id,
          academicYearId: academicYear.id,
          subjectId: subject.id,
          teacherProfileId:
            teachers[index % teachers.length].teacherProfile!.id,
        },
      }),
    ),
  );

  // Assign subjects to class 10-B
  const class10BSubjects = await Promise.all(
    subjects.slice(0, 4).map((subject, index) =>
      prisma.classSubject.create({
        data: {
          tenantId: tenant.id,
          classId: class10B.id,
          academicYearId: academicYear.id,
          subjectId: subject.id,
          teacherProfileId:
            teachers[index % teachers.length].teacherProfile!.id,
        },
      }),
    ),
  );
  console.log(`✅ Created class subjects for both classes\n`);

  // 8.5 Create schedules for calendar view
  console.log("🗓️  Creating schedules...");
  const buildTime = (baseDate: Date, hour: number, minute = 0) => {
    const date = new Date(baseDate);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  const normalizeDayOfWeek = (value: number) => (value === 0 ? 7 : value);

  const getNextDateForDayOfWeek = (baseDate: Date, dayOfWeek: number) => {
    const date = new Date(baseDate);
    const baseDay = normalizeDayOfWeek(date.getDay());
    let diff = dayOfWeek - baseDay;
    if (diff < 0) diff += 7;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const getPreviousDateForDayOfWeek = (baseDate: Date, dayOfWeek: number) => {
    const date = new Date(baseDate);
    const baseDay = normalizeDayOfWeek(date.getDay());
    let diff = baseDay - dayOfWeek;
    if (diff < 0) diff += 7;
    date.setDate(date.getDate() - diff);
    return date;
  };

  const combineDateAndTime = (date: Date, timeSource: Date) => {
    const result = new Date(date);
    result.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
    return result;
  };

  const allClassSubjects = [...class10ASubjects, ...class10BSubjects];

  const schedules = await Promise.all(
    allClassSubjects.map((classSubject, index) => {
      const dayOfWeek = (index % 5) + 1; // Monday - Friday
      const startHour = 7 + (index % 5); // 07:00 - 11:00
      const startTime = buildTime(new Date(), startHour);
      const endTime = buildTime(new Date(), startHour + 1);

      return prisma.schedule.create({
        data: {
          tenantId: tenant.id,
          classId: classSubject.classId,
          academicPeriodId: activePeriod.id,
          classSubjectId: classSubject.id,
          teacherProfileId: classSubject.teacherProfileId,
          dayOfWeek,
          startTime,
          endTime,
        },
      });
    }),
  );

  console.log(`✅ Created ${allClassSubjects.length} schedules\n`);

  // 8.6 Create full sessions for work days (07:00 - 15:00) for a teacher
  console.log(
    "🧪 Creating full-day teacher sessions (Mon-Fri, 07:00-15:00)...",
  );

  const teacherProfileId = teachers[0].teacherProfile!.id;
  const teacherClassSubject =
    class10ASubjects.find(
      (subject) => subject.teacherProfileId === teacherProfileId,
    ) ?? class10ASubjects[0];

  const weekStart = (() => {
    const base = new Date(today);
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    base.setDate(base.getDate() + diff);
    base.setHours(0, 0, 0, 0);
    return base;
  })();

  const workDays = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const withinActivePeriod = (date: Date) =>
    activePeriod.startDate && activePeriod.endDate
      ? date >= new Date(activePeriod.startDate) &&
        date <= new Date(activePeriod.endDate)
      : true;

  const sessionSeeds = workDays
    .filter(withinActivePeriod)
    .flatMap((sessionDate) =>
      Array.from({ length: 8 }, (_, slot) => {
        const start = new Date(sessionDate);
        start.setHours(7 + slot, 0, 0, 0);
        const end = new Date(sessionDate);
        end.setHours(8 + slot, 0, 0, 0);

        return {
          tenantId: tenant.id,
          classId: teacherClassSubject.classId,
          classSubjectId: teacherClassSubject.id,
          academicPeriodId: activePeriod.id,
          scheduleId: null,
          date: sessionDate,
          startTime: start,
          endTime: end,
        };
      }),
    );

  await Promise.all(
    sessionSeeds.map((session) =>
      prisma.session.create({
        data: session,
      }),
    ),
  );

  console.log(`✅ Created ${sessionSeeds.length} sessions\n`);

  // 9. Enroll students
  console.log("📝 Enrolling students...");

  // Split students between two classes
  const halfIndex = Math.floor(students.length / 2);
  const class10AStudents = students.slice(0, halfIndex);
  const class10BStudents = students.slice(halfIndex);

  await Promise.all([
    ...class10AStudents.map((student) =>
      prisma.classEnrollment.create({
        data: {
          tenantId: tenant.id,
          classId: class10A.id,
          studentProfileId: student.studentProfile!.id,
          startDate: academicYear.startDate!,
        },
      }),
    ),
    ...class10BStudents.map((student) =>
      prisma.classEnrollment.create({
        data: {
          tenantId: tenant.id,
          classId: class10B.id,
          studentProfileId: student.studentProfile!.id,
          startDate: academicYear.startDate!,
        },
      }),
    ),
  ]);
  console.log(
    `✅ Enrolled ${class10AStudents.length} students in ${class10A.name}`,
  );
  console.log(
    `✅ Enrolled ${class10BStudents.length} students in ${class10B.name}\n`,
  );

  console.log("✨ Seed completed successfully!\n");
  console.log("📋 Summary:");
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Users: ${1 + 1 + teachers.length + students.length} total`);
  console.log(`     • 1 Principal`);
  console.log(`     • 1 Admin`);
  console.log(`     • ${teachers.length} Teachers`);
  console.log(`     • ${students.length} Students`);
  console.log(`   - Academic Year: ${academicYear.label}`);
  console.log(`   - Subjects: ${subjects.length}`);
  console.log(`   - Classes: 2`);
  console.log(`\n🔐 Default password for all users: password123`);
  console.log("\n📧 Sample login credentials:");
  console.log("   Tenant slug: demo-school");
  console.log(`   Principal: principal@demo.school`);
  console.log(`   Admin: admin@demo.school`);
  console.log(`   Teacher: teacher1@demo.school`);
  console.log(`   Student: student001@demo.school`);
}

function getDefaultGrades(level: string): string[] {
  if (level === "SD") {
    return ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"];
  }

  if (level === "SMP") {
    return ["Kelas 7", "Kelas 8", "Kelas 9"];
  }

  if (level === "SMA" || level === "SMK") {
    return ["Kelas 10", "Kelas 11", "Kelas 12"];
  }

  return [];
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
