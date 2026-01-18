export const ACADEMIC_PERIOD_STATUS = ["DRAFT", "ARCHIVED"] as const;

export type AcademicPeriodStatus = (typeof ACADEMIC_PERIOD_STATUS)[number];
