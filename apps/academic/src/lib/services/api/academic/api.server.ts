import { createServerFn } from "@tanstack/react-start";
import { serverApi, isApiError } from "@/lib/services/api/api";
import type { AcademicContextResponse } from "./academic.types";
import { useAppSession } from "@/lib/utils/session.server";

export const getAcademicContextFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useAppSession();
    const accessToken = session.data.accessToken;

    if (!accessToken) {
      return null;
    }

    try {
      const response = await serverApi.get<AcademicContextResponse>(
        "/academic/context",
        {
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
  },
);
