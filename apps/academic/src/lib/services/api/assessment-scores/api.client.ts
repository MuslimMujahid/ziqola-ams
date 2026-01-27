import { clientApi } from "@/lib/services/api/api";
import type {
  GetAssessmentScoresResponse,
  GetAssessmentScoresVars,
  UpsertAssessmentScoresResponse,
  UpsertAssessmentScoresVars,
} from "./assessment-scores.types";

async function getAssessmentScores(params: GetAssessmentScoresVars) {
  const response = await clientApi.get<GetAssessmentScoresResponse>(
    "/assessment-scores",
    { params },
  );
  return response.data.data;
}

async function upsertAssessmentScores(vars: UpsertAssessmentScoresVars) {
  const response = await clientApi.put<UpsertAssessmentScoresResponse>(
    "/assessment-scores",
    vars,
  );
  return response.data.data;
}

export { getAssessmentScores, upsertAssessmentScores };
