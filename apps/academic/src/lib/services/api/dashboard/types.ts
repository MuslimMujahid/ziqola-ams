export type AdminStaffStatItems = {
  totalStudents: number;
  totalClasses: number;
  classesWithoutHomeroom: number;
  totalSubjects: number;
  unusedSubjectsCount: number;
  totalTeachers: number;
  unassignedTeachers: number;
  incompleteSchedulesClassCount: number;
  dataIssuesCount: number;
};

export type AdminStaffChecklistItem = {
  label: string;
  status: "Aktif" | "Peringatan" | "Perlu tindakan";
  href: string;
};

export type AdminStaffActivityItem = {
  title: string;
  timestamp: string;
  detail: string;
};

export type AdminStaffAlertItem = {
  title: string;
  detail: string;
  severity: "blocking" | "warning" | "info" | "success";
};

export type AdminStaffDashboardResponse = {
  schoolName: string;
  activeYearLabel: string;
  activePeriodLabel: string;
  stats: AdminStaffStatItems;
  checklist: AdminStaffChecklistItem[];
  activities: AdminStaffActivityItem[];
  alerts: AdminStaffAlertItem[];
};

export type GetAdminStaffDashboardSummaryVars = {
  academicYearId?: string | null;
  academicPeriodId?: string | null;
};
