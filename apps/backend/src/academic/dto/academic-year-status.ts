export const ACADEMIC_YEAR_STATUS = ["ACTIVE", "ARCHIVED"] as const;

export type AcademicYearStatus = (typeof ACADEMIC_YEAR_STATUS)[number];
