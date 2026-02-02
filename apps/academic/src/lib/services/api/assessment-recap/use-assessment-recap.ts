import type { PlaceholderDataFunction } from "@tanstack/react-query";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { assessmentRecapQueryKeys } from "./assessment-recap.keys";
import type {
  DecideHomeroomAssessmentRecapChangeVars,
  GetHomeroomAssessmentRecapVars,
  GetHomeroomRecapDetailVars,
  GetTeacherAssessmentRecapVars,
  RequestTeacherAssessmentRecapChangeVars,
  SubmitTeacherAssessmentRecapVars,
  TeacherAssessmentRecap,
  UpdateTeacherAssessmentRecapKkmVars,
} from "./assessment-recap.types";
import {
  decideHomeroomAssessmentRecapChange,
  getHomeroomAssessmentRecaps,
  getHomeroomRecapDetail,
  getHomeroomRecapOptions,
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

export function useHomeroomAssessmentRecaps(
  params: GetHomeroomAssessmentRecapVars,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: assessmentRecapQueryKeys.homeroomList(params),
    queryFn: () => getHomeroomAssessmentRecaps(params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useHomeroomRecapOptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: assessmentRecapQueryKeys.homeroomOptions(),
    queryFn: () => getHomeroomRecapOptions(),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useHomeroomRecapDetail(
  params: GetHomeroomRecapDetailVars,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: assessmentRecapQueryKeys.homeroomDetail(params.submissionId),
    queryFn: () => getHomeroomRecapDetail(params),
    enabled: options?.enabled ?? true,
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

export function useDecideHomeroomAssessmentRecapChange() {
  return useMutation({
    mutationFn: (payload: DecideHomeroomAssessmentRecapChangeVars) =>
      decideHomeroomAssessmentRecapChange(payload),
    meta: {
      invalidateQueries: [assessmentRecapQueryKeys.all],
    },
  });
}
