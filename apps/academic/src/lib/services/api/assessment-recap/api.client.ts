import { clientApi } from "@/lib/services/api/api";

import type {
  DecideHomeroomAssessmentRecapChangeResponse,
  DecideHomeroomAssessmentRecapChangeVars,
  GetHomeroomAssessmentRecapResponse,
  GetHomeroomAssessmentRecapVars,
  GetHomeroomRecapDetailResponse,
  GetHomeroomRecapDetailVars,
  GetHomeroomRecapOptionsResponse,
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

async function getHomeroomAssessmentRecaps(
  params?: GetHomeroomAssessmentRecapVars,
) {
  const response = await clientApi.get<GetHomeroomAssessmentRecapResponse>(
    "/assessment-recap/homeroom",
    { params },
  );
  return response.data.data;
}

async function getHomeroomRecapOptions() {
  const response = await clientApi.get<GetHomeroomRecapOptionsResponse>(
    "/assessment-recap/homeroom/options",
  );
  return response.data.data;
}

async function getHomeroomRecapDetail(vars: GetHomeroomRecapDetailVars) {
  const response = await clientApi.get<GetHomeroomRecapDetailResponse>(
    `/assessment-recap/homeroom/${vars.submissionId}`,
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

async function decideHomeroomAssessmentRecapChange(
  vars: DecideHomeroomAssessmentRecapChangeVars,
) {
  const { requestId, ...payload } = vars;
  const response =
    await clientApi.post<DecideHomeroomAssessmentRecapChangeResponse>(
      `/assessment-recap/change-requests/${requestId}/decision`,
      payload,
    );
  return response.data.data;
}

export {
  getTeacherAssessmentRecap,
  getHomeroomAssessmentRecaps,
  getHomeroomRecapOptions,
  getHomeroomRecapDetail,
  submitTeacherAssessmentRecap,
  updateTeacherAssessmentRecapKkm,
  requestTeacherAssessmentRecapChange,
  decideHomeroomAssessmentRecapChange,
};
