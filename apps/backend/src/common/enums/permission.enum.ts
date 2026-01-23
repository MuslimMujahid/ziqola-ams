/**
 * Fine-grained permissions for hybrid RBAC
 * These can be assigned to roles dynamically
 */
export enum Permission {
  // User Management
  USER_READ = "USER_READ",
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",

  // Student Management
  STUDENT_READ = "STUDENT_READ",
  STUDENT_CREATE = "STUDENT_CREATE",
  STUDENT_UPDATE = "STUDENT_UPDATE",
  STUDENT_DELETE = "STUDENT_DELETE",
  STUDENT_ENROLL = "STUDENT_ENROLL",

  // Teacher Management
  TEACHER_READ = "TEACHER_READ",
  TEACHER_CREATE = "TEACHER_CREATE",
  TEACHER_UPDATE = "TEACHER_UPDATE",
  TEACHER_DELETE = "TEACHER_DELETE",
  TEACHER_ASSIGN = "TEACHER_ASSIGN",

  // Academic Year Management
  ACADEMIC_YEAR_READ = "ACADEMIC_YEAR_READ",
  ACADEMIC_YEAR_CREATE = "ACADEMIC_YEAR_CREATE",
  ACADEMIC_YEAR_UPDATE = "ACADEMIC_YEAR_UPDATE",
  ACADEMIC_YEAR_DELETE = "ACADEMIC_YEAR_DELETE",
  ACADEMIC_YEAR_ACTIVATE = "ACADEMIC_YEAR_ACTIVATE",

  // Academic Period Management
  ACADEMIC_PERIOD_READ = "ACADEMIC_PERIOD_READ",
  ACADEMIC_PERIOD_CREATE = "ACADEMIC_PERIOD_CREATE",
  ACADEMIC_PERIOD_UPDATE = "ACADEMIC_PERIOD_UPDATE",
  ACADEMIC_PERIOD_DELETE = "ACADEMIC_PERIOD_DELETE",
  ACADEMIC_PERIOD_ACTIVATE = "ACADEMIC_PERIOD_ACTIVATE",

  // Class Management
  CLASS_READ = "CLASS_READ",
  CLASS_CREATE = "CLASS_CREATE",
  CLASS_UPDATE = "CLASS_UPDATE",
  CLASS_DELETE = "CLASS_DELETE",
  CLASS_ASSIGN_HOMEROOM = "CLASS_ASSIGN_HOMEROOM",

  // Subject Management
  SUBJECT_READ = "SUBJECT_READ",
  SUBJECT_CREATE = "SUBJECT_CREATE",
  SUBJECT_UPDATE = "SUBJECT_UPDATE",
  SUBJECT_DELETE = "SUBJECT_DELETE",
  SUBJECT_ASSIGN = "SUBJECT_ASSIGN",

  // Schedule Management
  SCHEDULE_READ = "SCHEDULE_READ",
  SCHEDULE_CREATE = "SCHEDULE_CREATE",
  SCHEDULE_UPDATE = "SCHEDULE_UPDATE",
  SCHEDULE_DELETE = "SCHEDULE_DELETE",

  // Session Management
  SESSION_READ = "SESSION_READ",
  SESSION_CREATE = "SESSION_CREATE",
  SESSION_UPDATE = "SESSION_UPDATE",
  SESSION_DELETE = "SESSION_DELETE",

  // Attendance
  ATTENDANCE_READ = "ATTENDANCE_READ",
  ATTENDANCE_RECORD = "ATTENDANCE_RECORD",
  ATTENDANCE_UPDATE = "ATTENDANCE_UPDATE",
  ATTENDANCE_READ_ALL = "ATTENDANCE_READ_ALL", // Can read attendance for all classes

  // Assessment & Grading
  ASSESSMENT_READ = "ASSESSMENT_READ",
  ASSESSMENT_CONFIGURE = "ASSESSMENT_CONFIGURE",
  GRADE_READ = "GRADE_READ",
  GRADE_INPUT = "GRADE_INPUT",
  GRADE_UPDATE = "GRADE_UPDATE",
  GRADE_LOCK = "GRADE_LOCK",
  GRADE_READ_ALL = "GRADE_READ_ALL", // Can read grades for all classes

  // Report Card
  REPORT_CARD_READ = "REPORT_CARD_READ",
  REPORT_CARD_GENERATE = "REPORT_CARD_GENERATE",
  REPORT_CARD_COMPILE = "REPORT_CARD_COMPILE", // Wali Kelas compiling
  REPORT_CARD_APPROVE = "REPORT_CARD_APPROVE", // Kepala Sekolah approval
  REPORT_CARD_LOCK = "REPORT_CARD_LOCK",
  REPORT_CARD_READ_ALL = "REPORT_CARD_READ_ALL",

  // Group Management
  GROUP_READ = "GROUP_READ",
  GROUP_CREATE = "GROUP_CREATE",
  GROUP_UPDATE = "GROUP_UPDATE",
  GROUP_DELETE = "GROUP_DELETE",

  // Tenant Management (super admin)
  TENANT_READ = "TENANT_READ",
  TENANT_UPDATE = "TENANT_UPDATE",

  // Audit Logs
  AUDIT_READ = "AUDIT_READ",
}

/**
 * Default permission sets for each role
 * This serves as the base permission configuration
 */
export const DefaultRolePermissions: Record<string, Permission[]> = {
  PRINCIPAL: [
    // Read everything
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.STUDENT_READ,
    Permission.STUDENT_CREATE,
    Permission.STUDENT_UPDATE,
    Permission.TEACHER_READ,
    Permission.TEACHER_CREATE,
    Permission.TEACHER_UPDATE,
    Permission.ACADEMIC_YEAR_READ,
    Permission.CLASS_READ,
    Permission.SUBJECT_READ,
    Permission.SCHEDULE_READ,
    Permission.SESSION_READ,
    Permission.SESSION_CREATE,
    Permission.SESSION_UPDATE,
    Permission.SESSION_DELETE,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_READ_ALL,
    Permission.ASSESSMENT_READ,
    Permission.GRADE_READ_ALL,
    Permission.REPORT_CARD_READ_ALL,
    Permission.GROUP_READ,
    Permission.AUDIT_READ,
    // Academic oversight
    Permission.ACADEMIC_YEAR_ACTIVATE,
    Permission.ACADEMIC_PERIOD_READ,
    Permission.ACADEMIC_PERIOD_CREATE,
    Permission.ACADEMIC_PERIOD_UPDATE,
    Permission.ACADEMIC_PERIOD_DELETE,
    Permission.ACADEMIC_PERIOD_ACTIVATE,
    Permission.REPORT_CARD_APPROVE,
    Permission.REPORT_CARD_LOCK,
    // Can update tenant settings
    Permission.TENANT_READ,
    Permission.TENANT_UPDATE,
  ],

  ADMIN_STAFF: [
    // Full user management
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    // Student management
    Permission.STUDENT_READ,
    Permission.STUDENT_CREATE,
    Permission.STUDENT_UPDATE,
    Permission.STUDENT_DELETE,
    Permission.STUDENT_ENROLL,
    // Teacher management
    Permission.TEACHER_READ,
    Permission.TEACHER_CREATE,
    Permission.TEACHER_UPDATE,
    Permission.TEACHER_DELETE,
    Permission.TEACHER_ASSIGN,
    // Academic structure
    Permission.ACADEMIC_YEAR_READ,
    Permission.ACADEMIC_YEAR_CREATE,
    Permission.ACADEMIC_YEAR_UPDATE,
    Permission.ACADEMIC_YEAR_DELETE,
    Permission.ACADEMIC_YEAR_ACTIVATE,
    Permission.ACADEMIC_PERIOD_READ,
    Permission.ACADEMIC_PERIOD_CREATE,
    Permission.ACADEMIC_PERIOD_UPDATE,
    Permission.ACADEMIC_PERIOD_DELETE,
    Permission.ACADEMIC_PERIOD_ACTIVATE,
    // Class management
    Permission.CLASS_READ,
    Permission.CLASS_CREATE,
    Permission.CLASS_UPDATE,
    Permission.CLASS_DELETE,
    Permission.CLASS_ASSIGN_HOMEROOM,
    // Subject management
    Permission.SUBJECT_READ,
    Permission.SUBJECT_CREATE,
    Permission.SUBJECT_UPDATE,
    Permission.SUBJECT_DELETE,
    Permission.SUBJECT_ASSIGN,
    // Group management
    Permission.GROUP_READ,
    Permission.GROUP_CREATE,
    Permission.GROUP_UPDATE,
    Permission.GROUP_DELETE,
    // Schedule management
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
    // Session management
    Permission.SESSION_READ,
    Permission.SESSION_CREATE,
    Permission.SESSION_UPDATE,
    Permission.SESSION_DELETE,
    // Read-only access to academic data
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_READ_ALL,
    Permission.GRADE_READ_ALL,
    Permission.REPORT_CARD_READ_ALL,
    // Tenant read
    Permission.TENANT_READ,
  ],

  TEACHER: [
    // View academic structure
    Permission.ACADEMIC_YEAR_READ,
    Permission.CLASS_READ,
    Permission.SUBJECT_READ,
    Permission.SCHEDULE_READ,
    Permission.STUDENT_READ,
    Permission.TEACHER_READ,
    // Teaching duties
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_RECORD,
    Permission.ATTENDANCE_UPDATE,
    Permission.ASSESSMENT_READ,
    Permission.ASSESSMENT_CONFIGURE,
    Permission.GRADE_READ,
    Permission.GRADE_INPUT,
    Permission.GRADE_UPDATE,
    Permission.GRADE_LOCK,
    // Session access (assigned classes)
    Permission.SESSION_READ,
    Permission.SESSION_CREATE,
    // Report cards (limited to assigned classes)
    Permission.REPORT_CARD_READ,
    Permission.REPORT_CARD_GENERATE,
    // Note: REPORT_CARD_COMPILE is context-specific (Wali Kelas only)
  ],

  STUDENT: [
    // View-only access to own data
    Permission.SCHEDULE_READ,
    Permission.ATTENDANCE_READ,
    Permission.GRADE_READ,
    Permission.REPORT_CARD_READ,
    Permission.SESSION_READ,
  ],
};
