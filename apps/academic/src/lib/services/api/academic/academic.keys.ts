import type {
  GetAcademicPeriodsVars,
  GetAcademicYearsVars,
} from "./academic.types";

const academicQueryKeys = {
  all: ["academic"] as const,
  context: () => [...academicQueryKeys.all, "context"] as const,
  years: (params?: GetAcademicYearsVars) =>
    [...academicQueryKeys.all, "years", params ?? {}] as const,
  year: (id: string) =>
    [...academicQueryKeys.all, "years", "detail", id] as const,
  periods: (params?: GetAcademicPeriodsVars) =>
    [...academicQueryKeys.all, "periods", params ?? {}] as const,
  period: (id: string) =>
    [...academicQueryKeys.all, "periods", "detail", id] as const,
};

export { academicQueryKeys };
