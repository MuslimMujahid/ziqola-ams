import type { ApiResponse } from "@/lib/services/api/api.types";

type AcademicYearStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type AcademicPeriodStatus = "DRAFT" | "ARCHIVED";

type AcademicYear = {
  id: string;
  tenantId: string;
  label: string;
  status: AcademicYearStatus;
  startDate?: string | null;
  endDate?: string | null;
  activePeriodId?: string | null;
  createdAt?: string | null;
};

type AcademicPeriod = {
  id: string;
  tenantId: string;
  academicYearId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  orderIndex: number;
  status: AcademicPeriodStatus;
  createdAt?: string | null;
};

type AcademicContext = {
  year: Pick<
    AcademicYear,
    "id" | "label" | "status" | "startDate" | "endDate" | "activePeriodId"
  > | null;
  period: Pick<
    AcademicPeriod,
    | "id"
    | "name"
    | "startDate"
    | "endDate"
    | "orderIndex"
    | "status"
    | "academicYearId"
  > | null;
};

type CreateAcademicYearVars = {
  label: string;
  startDate?: string;
  endDate?: string;
  status?: AcademicYearStatus;
  makeActive?: boolean;
};

type CreateAcademicPeriodVars = {
  academicYearId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: AcademicPeriodStatus;
  orderIndex?: number;
  makeActive?: boolean;
};

type CreateAcademicSetupVars = {
  year: CreateAcademicYearVars;
  period: Omit<CreateAcademicPeriodVars, "academicYearId">;
};

type CreateAcademicOnboardingVars = {
  year: CreateAcademicYearVars;
  period: Omit<CreateAcademicPeriodVars, "academicYearId">;
};

type AcademicSetup = {
  year: AcademicYear;
  period: AcademicPeriod;
};

type AcademicContextResponse = ApiResponse<AcademicContext>;
type CreateAcademicYearResponse = ApiResponse<AcademicYear>;
type CreateAcademicPeriodResponse = ApiResponse<AcademicPeriod>;
type CreateAcademicSetupResponse = ApiResponse<AcademicSetup>;
type CreateAcademicOnboardingResponse = ApiResponse<AcademicSetup>;

export type {
  AcademicYear,
  AcademicYearStatus,
  AcademicPeriod,
  AcademicPeriodStatus,
  AcademicContext,
  AcademicContextResponse,
  CreateAcademicYearVars,
  CreateAcademicPeriodVars,
  CreateAcademicSetupVars,
  CreateAcademicOnboardingVars,
  AcademicSetup,
  CreateAcademicYearResponse,
  CreateAcademicPeriodResponse,
  CreateAcademicSetupResponse,
  CreateAcademicOnboardingResponse,
};
