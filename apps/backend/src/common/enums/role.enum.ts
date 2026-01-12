/**
 * User Roles in the system
 * Matches Prisma schema Role enum
 */
export enum Role {
  PRINCIPAL = "PRINCIPAL",
  ADMIN_STAFF = "ADMIN_STAFF",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

/**
 * Indonesian terminology mapping for display purposes
 */
export const RoleLabels: Record<Role, string> = {
  [Role.PRINCIPAL]: "Kepala Sekolah",
  [Role.ADMIN_STAFF]: "Tata Usaha",
  [Role.TEACHER]: "Guru",
  [Role.STUDENT]: "Siswa",
};
