const ROLE_LABELS = {
  PRINCIPAL: "Kepala Sekolah",
  ADMIN_STAFF: "Staf Administrasi",
  TEACHER: "Guru",
  STUDENT: "Siswa",
} as const;

export const AUTH_ROLE_VALUES = [
  "PRINCIPAL",
  "ADMIN_STAFF",
  "TEACHER",
  "STUDENT",
] as const satisfies readonly (keyof typeof ROLE_LABELS)[];

export type AuthRole = keyof typeof ROLE_LABELS;

const ROLE_DASHBOARD_PATHS: Record<AuthRole, string> = {
  PRINCIPAL: "/dashboard/principal",
  ADMIN_STAFF: "/dashboard/admin-staff",
  TEACHER: "/dashboard/teacher",
  STUDENT: "/dashboard/student",
};

export function getDashboardRoute(role: AuthRole | string) {
  const key = String(role).toUpperCase() as AuthRole;
  return ROLE_DASHBOARD_PATHS[key] ?? "/dashboard";
}

export function getRoleLabel(role: AuthRole | string) {
  const key = String(role).toUpperCase() as AuthRole;
  return ROLE_LABELS[key] ?? String(role);
}
