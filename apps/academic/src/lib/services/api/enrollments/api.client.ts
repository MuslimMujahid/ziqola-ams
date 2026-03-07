import { clientApi } from "@/lib/services/api/api";
import type {
  CreateEnrollmentResponse,
  CreateEnrollmentVars,
} from "./enrollments.types";

async function createEnrollment(vars: CreateEnrollmentVars) {
  const response = await clientApi.post<CreateEnrollmentResponse>(
    "/enrollments",
    vars,
  );
  return response.data.data;
}

export { createEnrollment };
