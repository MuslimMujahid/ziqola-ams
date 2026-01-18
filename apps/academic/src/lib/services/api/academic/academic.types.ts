import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

type AcademicYearStatus = "ACTIVE" | "ARCHIVED";
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
  makeActive?: boolean;
};

type UpdateAcademicYearVars = {
  id: string;
  label?: string;
  startDate?: string;
  endDate?: string;
};

type ActivateAcademicYearVars = {
  id: string;
};

type DeleteAcademicYearVars = {
  id: string;
};

type CreateAcademicPeriodVars = {
  academicYearId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: AcademicPeriodStatus;
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
type GetAcademicYearsVars = QueryParams<{ status?: AcademicYearStatus }>;
type GetAcademicYearsResponse = ApiListResponse<AcademicYear>;
type GetAcademicPeriodsVars = QueryParams<{
  academicYearId?: string;
  status?: AcademicPeriodStatus;
}>;
type GetAcademicPeriodsResponse = ApiListResponse<AcademicPeriod>;
type CreateAcademicYearResponse = ApiResponse<AcademicYear>;
type UpdateAcademicYearResponse = ApiResponse<AcademicYear>;
type ActivateAcademicYearResponse = ApiResponse<AcademicYear>;
type DeleteAcademicYearResponse = ApiResponse<AcademicYear>;
type CreateAcademicPeriodResponse = ApiResponse<AcademicPeriod>;
type UpdateAcademicPeriodVars = {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: AcademicPeriodStatus;
};
type UpdateAcademicPeriodResponse = ApiResponse<AcademicPeriod>;
type ActivateAcademicPeriodVars = {
  id: string;
};
type ActivateAcademicPeriodResponse = ApiResponse<AcademicPeriod>;
type CreateAcademicSetupResponse = ApiResponse<AcademicSetup>;
type CreateAcademicOnboardingResponse = ApiResponse<AcademicSetup>;

export type {
  AcademicYear,
  AcademicYearStatus,
  AcademicPeriod,
  AcademicPeriodStatus,
  AcademicContext,
  AcademicContextResponse,
  ActivateAcademicYearResponse,
  ActivateAcademicYearVars,
  DeleteAcademicYearResponse,
  DeleteAcademicYearVars,
  CreateAcademicYearVars,
  CreateAcademicPeriodVars,
  CreateAcademicSetupVars,
  CreateAcademicOnboardingVars,
  AcademicSetup,
  CreateAcademicYearResponse,
  UpdateAcademicYearResponse,
  UpdateAcademicYearVars,
  GetAcademicYearsVars,
  GetAcademicYearsResponse,
  GetAcademicPeriodsVars,
  GetAcademicPeriodsResponse,
  CreateAcademicPeriodResponse,
  UpdateAcademicPeriodVars,
  UpdateAcademicPeriodResponse,
  ActivateAcademicPeriodVars,
  ActivateAcademicPeriodResponse,
  CreateAcademicSetupResponse,
  CreateAcademicOnboardingResponse,
};
