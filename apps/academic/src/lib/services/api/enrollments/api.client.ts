import { clientApi } from "@/lib/services/api/api";
import type {
  CreateEnrollmentResponse,
  CreateEnrollmentVars,
  UpdateEnrollmentResponse,
  UpdateEnrollmentVars,
} from "./enrollments.types";

async function createEnrollment(vars: CreateEnrollmentVars) {
  const response = await clientApi.post<CreateEnrollmentResponse>(
    "/enrollments",
    vars,
  );
  return response.data.data;
}

async function updateEnrollment(vars: UpdateEnrollmentVars) {
  const response = await clientApi.patch<UpdateEnrollmentResponse>(
    `/enrollments/${vars.id}`,
    { endDate: vars.endDate },
  );
  return response.data.data;
}

export { createEnrollment, updateEnrollment };
