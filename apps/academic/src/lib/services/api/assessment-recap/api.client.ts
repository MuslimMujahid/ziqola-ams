import { clientApi } from "@/lib/services/api/api";

import type {
  GetTeacherAssessmentRecapResponse,
  GetTeacherAssessmentRecapVars,
  RequestTeacherAssessmentRecapChangeResponse,
  RequestTeacherAssessmentRecapChangeVars,
  SubmitTeacherAssessmentRecapResponse,
  SubmitTeacherAssessmentRecapVars,
  UpdateTeacherAssessmentRecapKkmResponse,
  UpdateTeacherAssessmentRecapKkmVars,
} from "./assessment-recap.types";

async function getTeacherAssessmentRecap(
  params?: GetTeacherAssessmentRecapVars,
) {
  const response = await clientApi.get<GetTeacherAssessmentRecapResponse>(
    "/assessment-recap",
    { params },
  );
  return response.data.data;
}

async function submitTeacherAssessmentRecap(
  vars: SubmitTeacherAssessmentRecapVars,
) {
  const response = await clientApi.post<SubmitTeacherAssessmentRecapResponse>(
    "/assessment-recap/submit",
    vars,
  );
  return response.data.data;
}

async function updateTeacherAssessmentRecapKkm(
  vars: UpdateTeacherAssessmentRecapKkmVars,
) {
  const response =
    await clientApi.patch<UpdateTeacherAssessmentRecapKkmResponse>(
      "/assessment-recap/kkm",
      vars,
    );
  return response.data.data;
}

async function requestTeacherAssessmentRecapChange(
  vars: RequestTeacherAssessmentRecapChangeVars,
) {
  const response =
    await clientApi.post<RequestTeacherAssessmentRecapChangeResponse>(
      "/assessment-recap/change-requests",
      vars,
    );
  return response.data.data;
}

export {
  getTeacherAssessmentRecap,
  submitTeacherAssessmentRecap,
  updateTeacherAssessmentRecapKkm,
  requestTeacherAssessmentRecapChange,
};
