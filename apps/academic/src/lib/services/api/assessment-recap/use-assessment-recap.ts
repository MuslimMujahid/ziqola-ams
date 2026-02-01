import type { PlaceholderDataFunction } from "@tanstack/react-query";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { assessmentRecapQueryKeys } from "./assessment-recap.keys";
import type {
  GetTeacherAssessmentRecapVars,
  RequestTeacherAssessmentRecapChangeVars,
  SubmitTeacherAssessmentRecapVars,
  TeacherAssessmentRecap,
  UpdateTeacherAssessmentRecapKkmVars,
} from "./assessment-recap.types";
import {
  getTeacherAssessmentRecap,
  requestTeacherAssessmentRecapChange,
  submitTeacherAssessmentRecap,
  updateTeacherAssessmentRecapKkm,
} from "./api.client";

export function useTeacherAssessmentRecap(
  params: GetTeacherAssessmentRecapVars,
  options?: {
    enabled?: boolean;
    placeholderData?: PlaceholderDataFunction<TeacherAssessmentRecap>;
  },
) {
  return useQuery<TeacherAssessmentRecap>({
    queryKey: assessmentRecapQueryKeys.detail(params),
    queryFn: () => getTeacherAssessmentRecap(params),
    enabled: options?.enabled ?? true,
    placeholderData: options?.placeholderData,
    staleTime: 30_000,
  });
}

export function useSuspenseTeacherAssessmentRecap(
  params: GetTeacherAssessmentRecapVars,
) {
  return useSuspenseQuery<TeacherAssessmentRecap>({
    queryKey: assessmentRecapQueryKeys.detail(params),
    queryFn: () => getTeacherAssessmentRecap(params),
    staleTime: 30_000,
  });
}

export function useSubmitTeacherAssessmentRecap() {
  return useMutation({
    mutationFn: (payload: SubmitTeacherAssessmentRecapVars) =>
      submitTeacherAssessmentRecap(payload),
    meta: {
      invalidateQueries: [assessmentRecapQueryKeys.all],
    },
  });
}

export function useUpdateTeacherAssessmentRecapKkm() {
  return useMutation({
    mutationFn: (payload: UpdateTeacherAssessmentRecapKkmVars) =>
      updateTeacherAssessmentRecapKkm(payload),
    meta: {
      invalidateQueries: [assessmentRecapQueryKeys.all],
    },
  });
}

export function useRequestTeacherAssessmentRecapChange() {
  return useMutation({
    mutationFn: (payload: RequestTeacherAssessmentRecapChangeVars) =>
      requestTeacherAssessmentRecapChange(payload),
    meta: {
      invalidateQueries: [assessmentRecapQueryKeys.all],
    },
  });
}
