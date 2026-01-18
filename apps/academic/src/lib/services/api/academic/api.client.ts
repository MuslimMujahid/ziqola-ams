import { clientApi } from "@/lib/services/api/api";
import type {
  AcademicContextResponse,
  CreateAcademicPeriodResponse,
  CreateAcademicPeriodVars,
  CreateAcademicOnboardingResponse,
  CreateAcademicOnboardingVars,
  CreateAcademicSetupResponse,
  CreateAcademicSetupVars,
  CreateAcademicYearResponse,
  CreateAcademicYearVars,
} from "./academic.types";

async function getAcademicContext() {
  const response =
    await clientApi.get<AcademicContextResponse>("/academic/context");
  return response.data.data;
}

async function createAcademicYear(vars: CreateAcademicYearVars) {
  const response = await clientApi.post<CreateAcademicYearResponse>(
    "/academic/years",
    vars,
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
  createAcademicYear,
  createAcademicPeriod,
  createAcademicSetup,
  createAcademicOnboarding,
};
