import { clientApi } from "@/lib/services/api/api";
import type {
  CreateAssessmentComponentResponse,
  CreateAssessmentComponentVars,
  DeleteAssessmentComponentResponse,
  DeleteAssessmentComponentVars,
  GetAssessmentComponentsResponse,
  GetAssessmentComponentsVars,
  GetAssessmentTypeWeightsResponse,
  GetAssessmentTypeWeightsVars,
  UpdateAssessmentComponentResponse,
  UpdateAssessmentComponentVars,
  UpsertAssessmentTypeWeightResponse,
  UpsertAssessmentTypeWeightVars,
} from "./assessment-components.types";

async function getAssessmentComponents(params: GetAssessmentComponentsVars) {
  const response = await clientApi.get<GetAssessmentComponentsResponse>(
    "/assessment-components",
    { params },
  );
  return response.data;
}

async function createAssessmentComponent(vars: CreateAssessmentComponentVars) {
  const response = await clientApi.post<CreateAssessmentComponentResponse>(
    "/assessment-components",
    vars,
  );
  return response.data.data;
}

async function updateAssessmentComponent(vars: UpdateAssessmentComponentVars) {
  const { id, ...payload } = vars;
  const response = await clientApi.patch<UpdateAssessmentComponentResponse>(
    `/assessment-components/${id}`,
    payload,
  );
  return response.data.data;
}

async function deleteAssessmentComponent(vars: DeleteAssessmentComponentVars) {
  const response = await clientApi.delete<DeleteAssessmentComponentResponse>(
    `/assessment-components/${vars.id}`,
  );
  return response.data.data;
}

async function getAssessmentTypeWeights(params: GetAssessmentTypeWeightsVars) {
  const response = await clientApi.get<GetAssessmentTypeWeightsResponse>(
    "/assessment-components/type-weights",
    { params },
  );
  return response.data;
}

async function upsertAssessmentTypeWeight(
  vars: UpsertAssessmentTypeWeightVars,
) {
  const response = await clientApi.put<UpsertAssessmentTypeWeightResponse>(
    "/assessment-components/type-weights",
    vars,
  );
  return response.data.data;
}

export {
  getAssessmentComponents,
  createAssessmentComponent,
  updateAssessmentComponent,
  deleteAssessmentComponent,
  getAssessmentTypeWeights,
  upsertAssessmentTypeWeight,
};
