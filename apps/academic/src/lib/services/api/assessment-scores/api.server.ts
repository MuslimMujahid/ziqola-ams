import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isApiError, serverApi } from "@/lib/services/api/api";
import { useAppSession } from "@/lib/utils/session.server";
import type {
  GetAssessmentScoresResponse,
  GetAssessmentScoresVars,
} from "./assessment-scores.types";

const getAssessmentScoresSchema = z.object({
  componentId: z.string().uuid(),
});

export const getAssessmentScoresFn = createServerFn({ method: "GET" })
  .inputValidator((data: GetAssessmentScoresVars) =>
    getAssessmentScoresSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const session = await useAppSession();
    const accessToken = session.data.accessToken;

    if (!accessToken) {
      throw new Error("Unauthorized");
    }

    try {
      const response = await serverApi.get<GetAssessmentScoresResponse>(
        "/assessment-scores",
        {
          params: data,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data.data;
    } catch (error) {
      if (isApiError(error)) {
        const message =
          error.response?.data?.message ?? error.message ?? "Failed to load";
        throw new Error(message);
      }
      throw error;
    }
  });
