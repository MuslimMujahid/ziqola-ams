import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStaffSummary(
    tenantId: string,
    queryYearId?: string,
    queryPeriodId?: string,
  ) {
    const activeYear = await this.prisma.client.academicYear.findFirst({
      where: {
        tenantId,
        ...(queryYearId ? { id: queryYearId } : { status: 'ACTIVE' }),
      },
      include: {
        activePeriod: true,
      },
    });

    let activePeriodName = activeYear?.activePeriod?.name || 'Belum diatur';
    if (queryPeriodId && queryPeriodId !== activeYear?.activePeriodId) {
      const specificPeriod = await this.prisma.client.academicPeriod.findUnique({
        where: { id: queryPeriodId },
      });
      if (specificPeriod) {
        activePeriodName = specificPeriod.name;
      }
    }

    const activeYearLabel = activeYear?.label || 'Belum diatur';

    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // 1. STAT_ITEMS
    const [totalStudents, totalClasses, totalSubjects, totalTeachers] = await Promise.all([
      this.prisma.client.studentProfile.count({ 
        where: { 
          tenantId,
          ...(activeYear?.id ? {
            classEnrollments: {
              some: {
                class: {
                  academicYearId: activeYear.id
                }
              }
            }
          } : {})
        } 
      }),
      this.prisma.client.class.count({ 
        where: { 
          tenantId, 
          academicYearId: activeYear?.id 
        } 
      }),
      this.prisma.client.subject.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.client.teacherProfile.count({ where: { tenantId } }),
    ]);

    // Rough estimations for helpers (can be refined later if specific queries exist)
    const classesWithoutHomeroom = await this.prisma.client.class.count({
      where: {
        tenantId,
        academicYearId: activeYear?.id,
        homeroomAssignments: {
          none: {
            isActive: true,
            academicYearId: activeYear?.id
          }
        }
      }
    });

    const unassignedTeachers = await this.prisma.client.teacherProfile.count({
      where: {
        tenantId,
        OR: [
          { homeroomAssignments: { none: { isActive: true, academicYearId: activeYear?.id } } },
          { classSubjects: { none: { isDeleted: false, academicYearId: activeYear?.id } } }
        ]
      }
    });

    // Count subjects that are not used in any ClassSubject for the active year
    const unusedSubjectsCount = await this.prisma.client.subject.count({
      where: {
        tenantId,
        isDeleted: false,
        classSubjects: activeYear?.id
          ? { none: { academicYearId: activeYear.id, isDeleted: false } }
          : { none: { isDeleted: false } },
      },
    });
    // Calculate Schedule Completion
    let incompleteSchedulesClassCount = 0;
    let schedulePercentage = 0;

    if (activeYear?.id && activeYear?.activePeriodId) {
      // Find all classes in this year
      const classes = await this.prisma.client.class.findMany({
        where: { tenantId, academicYearId: activeYear.id },
        include: {
          classSubjects: {
            where: { isDeleted: false },
            include: {
              schedules: {
                where: { academicPeriodId: activeYear.activePeriodId }
              }
            }
          }
        }
      });

      let fullyScheduledClasses = 0;

      for (const cls of classes) {
        if (cls.classSubjects.length === 0) {
          // A class without subjects is not "scheduled"
          continue;
        }

        const isFullyScheduled = cls.classSubjects.every(
          subject => subject.schedules.length > 0
        );

        if (isFullyScheduled) {
          fullyScheduledClasses++;
        }
      }

      const totalActiveClasses = classes.length;
      incompleteSchedulesClassCount = totalActiveClasses - fullyScheduledClasses;
      
      if (totalActiveClasses > 0) {
        schedulePercentage = Math.round((fullyScheduledClasses / totalActiveClasses) * 100);
      }
    } else {
      incompleteSchedulesClassCount = totalClasses;
    }
    // Calculate Teacher Conflicts
    let teachersWithConflictsCount = 0;
    if (activeYear?.activePeriodId) {
      // For each teacher, get their schedules in the active period
      // and check for overlaps. This is a bit heavy, but fine for a dashboard aggregate
      // if the data size is small. In a real highly-scaled app, we'd cache this or DB view it.
      const schedules = await this.prisma.client.schedule.findMany({
        where: { tenantId, academicPeriodId: activeYear.activePeriodId },
        select: { teacherProfileId: true, dayOfWeek: true, startTime: true, endTime: true },
        orderBy: [{ teacherProfileId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });

      let currentTeacher: string | null = null;
      let currentDay: number | null = null;
      let lastEndTime: Date | null = null;
      const conflictedTeachers = new Set<string>();

      for (const sched of schedules) {
        if (sched.teacherProfileId !== currentTeacher || sched.dayOfWeek !== currentDay) {
          currentTeacher = sched.teacherProfileId;
          currentDay = sched.dayOfWeek;
          lastEndTime = sched.endTime;
          continue;
        }

        // If same teacher and day, check if start time overlaps with last end time
        if (lastEndTime && sched.startTime < lastEndTime) {
          conflictedTeachers.add(sched.teacherProfileId);
        }
        
        // Update last end time to the maximum of the two resolving overlaps
        if (!lastEndTime || sched.endTime > lastEndTime) {
          lastEndTime = sched.endTime;
        }
      }

      teachersWithConflictsCount = conflictedTeachers.size;
    }

    const dataIssuesCount = (classesWithoutHomeroom > 0 ? 1 : 0) + 
                            (incompleteSchedulesClassCount > 0 ? 1 : 0) + 
                            (teachersWithConflictsCount > 0 ? 1 : 0);

    // 2. CHECKLIST_ITEMS
    const checklist = [
      {
        label: "Tahun ajaran aktif",
        status: activeYear ? "Aktif" : "Perlu tindakan",
        href: "/dashboard/admin-staff/settings/academic-years",
      },
      {
        label: "Periode akademik aktif",
        status: activeYear?.activePeriod ? "Aktif" : "Perlu tindakan",
        href: "/dashboard/admin-staff/settings/academic-years",
      },
      {
        label: "Semua kelas memiliki guru per mata pelajaran",
        // True if no unassigned teachers AND classes are mapped? (simplification: just use unassigned indicator)
        status: unassignedTeachers === 0 ? "Aktif" : "Perlu tindakan",
        href: "/dashboard/admin-staff/teachers",
      },
      {
        label: `Jadwal bentrok pada ${teachersWithConflictsCount} guru`,
        status: teachersWithConflictsCount === 0 ? "Aktif" : "Peringatan",
        href: "/dashboard/admin-staff/schedules",
      }
    ];

    if (classesWithoutHomeroom > 0) {
      checklist.push({
        label: `${classesWithoutHomeroom} kelas belum memiliki wali kelas`,
        status: "Perlu tindakan",
        href: "/dashboard/admin-staff/class-management",
      });
    }

    // 3. ACTIVITY_ITEMS (Fetch from AuditLog if it exists, otherwise empty for now)
    const activitiesData = await this.prisma.client.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: 3,
      include: {
        actor: {
          select: { name: true, role: true }
        }
      }
    });

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID');
    };

    const activities = activitiesData.map(log => ({
      title: `${log.action} ${log.entityType}`,
      timestamp: formatTime(log.timestamp),
      detail: `Oleh: ${log.actor?.name ?? log.actorId ?? 'Sistem'}`
    }));

    // If no activities yet
    if (activities.length === 0) {
      activities.push({
        title: "Sistem dimulai",
        timestamp: "Hari ini",
        detail: "Tidak ada aktivitas terbaru"
      });
    }

    // 4. ALERT_ITEMS (Based on dynamic conditions)
    const alerts: { title: string; detail: string; severity: string }[] = [];
    if (!activeYear?.activePeriod) {
      alerts.push({
        title: "Periode belum aktif",
        detail: "Harap atur periode akademik aktif agar fitur lain dapat berjalan.",
        severity: "blocking",
      });
    } else {
      alerts.push({
        title: "Periode akademik aktif",
        detail: `${activePeriodName} aktif, pastikan jadwal dipublikasikan.`,
        severity: "info",
      });
    }

    if (classesWithoutHomeroom > 0) {
      alerts.push({
        title: "Wali kelas kurang",
        detail: `${classesWithoutHomeroom} kelas belum memiliki wali kelas.`,
        severity: "warning",
      });
    }

    if (teachersWithConflictsCount > 0) {
      alerts.push({
        title: "Bentrok Jadwal guru",
        detail: `${teachersWithConflictsCount} guru mengajar di dua kelas pada jam yang sama.`,
        severity: "blocking", // Mockup shows a red X circle for this
      });
    }

    if (incompleteSchedulesClassCount > 0) {
      alerts.push({
        title: "Jadwal belum lengkap",
        detail: `${incompleteSchedulesClassCount} kelas belum memiliki jadwal lengkap.`,
        severity: "warning", // Mockup shows an orange alert triangle
      });
    }

    return {
      schoolName: tenant?.name ?? "Ziqola",
      activeYearLabel,
      activePeriodLabel: activePeriodName,
      stats: {
        totalStudents,
        totalClasses,
        classesWithoutHomeroom,
        totalSubjects,
        unusedSubjectsCount,
        totalTeachers,
        unassignedTeachers,
        schedulePercentage,
        incompleteSchedulesClassCount,
        dataIssuesCount,
      },
      checklist,
      activities,
      alerts,
    };
  }
}
