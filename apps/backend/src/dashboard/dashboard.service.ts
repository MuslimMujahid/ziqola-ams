import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStaffSummary(tenantId: string) {
    const activeYear = await this.prisma.client.academicYear.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        activePeriod: true,
      },
    });

    const activePeriodName = activeYear?.activePeriod?.name || 'Belum diatur';
    const activeYearLabel = activeYear?.label || 'Belum diatur';

    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // 1. STAT_ITEMS
    const [totalStudents, totalClasses, totalSubjects, totalTeachers] = await Promise.all([
      this.prisma.client.studentProfile.count({ where: { tenantId } }),
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

    // We can simulate some missing stats by setting them to null or 0 if appropriate
    const unusedSubjectsCount = null; // Requires complex join to see if a subject is in classSubjects
    const incompleteSchedulesClassCount = null; // Requires checking if all classSubjects have schedules
    const dataIssuesCount = null; // Generic data issue count

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
        incompleteSchedulesClassCount,
        dataIssuesCount,
      },
      checklist,
      activities,
      alerts,
    };
  }
}
