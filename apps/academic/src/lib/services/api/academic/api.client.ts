import { clientApi } from "@/lib/services/api/api";
import type {
  ActivateAcademicYearResponse,
  ActivateAcademicYearVars,
  AcademicContextResponse,
  DeleteAcademicYearResponse,
  DeleteAcademicYearVars,
  GetAcademicYearsResponse,
  GetAcademicYearsVars,
  CreateAcademicPeriodResponse,
  CreateAcademicPeriodVars,
  GetAcademicPeriodsResponse,
  GetAcademicPeriodsVars,
  UpdateAcademicPeriodResponse,
  UpdateAcademicPeriodVars,
  ActivateAcademicPeriodResponse,
  ActivateAcademicPeriodVars,
  CreateAcademicOnboardingResponse,
  CreateAcademicOnboardingVars,
  CreateAcademicSetupResponse,
  CreateAcademicSetupVars,
  CreateAcademicYearResponse,
  CreateAcademicYearVars,
  UpdateAcademicYearResponse,
  UpdateAcademicYearVars,
} from "./academic.types";

async function getAcademicContext() {
  const response =
    await clientApi.get<AcademicContextResponse>("/academic/context");
  return response.data.data;
}

async function getAcademicYears(params?: GetAcademicYearsVars) {
  const response = await clientApi.get<GetAcademicYearsResponse>(
    "/academic/years",
    {
      params,
    },
  );
  return response.data;
}

async function getAcademicPeriods(params?: GetAcademicPeriodsVars) {
  const response = await clientApi.get<GetAcademicPeriodsResponse>(
    "/academic/periods",
    {
      params,
    },
  );
  return response.data;
}

async function createAcademicYear(vars: CreateAcademicYearVars) {
  const response = await clientApi.post<CreateAcademicYearResponse>(
    "/academic/years",
    vars,
  );
  return response.data.data;
}

async function updateAcademicYear(vars: UpdateAcademicYearVars) {
  const response = await clientApi.patch<UpdateAcademicYearResponse>(
    `/academic/years/${vars.id}`,
    vars,
  );
  return response.data.data;
}

async function deleteAcademicYear(vars: DeleteAcademicYearVars) {
  const response = await clientApi.delete<DeleteAcademicYearResponse>(
    `/academic/years/${vars.id}`,
  );
  return response.data.data;
}

async function activateAcademicYear(vars: ActivateAcademicYearVars) {
  const response = await clientApi.post<ActivateAcademicYearResponse>(
    `/academic/years/${vars.id}/activate`,
  );
  return response.data.data;
}

async function createAcademicPeriod(vars: CreateAcademicPeriodVars) {
  const response = await clientApi.post<CreateAcademicPeriodResponse>(
    "/academic/periods",
    vars,
  );
  return response.data.data;
}

async function updateAcademicPeriod(vars: UpdateAcademicPeriodVars) {
  const response = await clientApi.patch<UpdateAcademicPeriodResponse>(
    `/academic/periods/${vars.id}`,
    vars,
  );
  return response.data.data;
}

async function activateAcademicPeriod(vars: ActivateAcademicPeriodVars) {
  const response = await clientApi.post<ActivateAcademicPeriodResponse>(
    `/academic/periods/${vars.id}/activate`,
  );
  return response.data.data;
}

async function createAcademicSetup(vars: CreateAcademicSetupVars) {
  const response = await clientApi.post<CreateAcademicSetupResponse>(
    "/academic/setup",
    vars,
  );
  return response.data.data;
}

async function createAcademicOnboarding(vars: CreateAcademicOnboardingVars) {
  const response = await clientApi.post<CreateAcademicOnboardingResponse>(
    "/academic/onboarding",
    vars,
  );
  return response.data.data;
}

export {
  getAcademicContext,
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deleteAcademicYear,
  getAcademicPeriods,
  createAcademicPeriod,
  updateAcademicPeriod,
  activateAcademicPeriod,
  createAcademicSetup,
  createAcademicOnboarding,
};
