import { useMutation } from "@tanstack/react-query";

import { importStudents } from "./api.client";
import { studentsQueryKeys } from "./students.keys";
import type { ImportStudentsVars } from "./students.types";

type ImportStudentsPayload = {
  data: ImportStudentsVars;
  signal?: AbortSignal;
};

export function useImportStudents() {
  return useMutation({
    mutationFn: (payload: ImportStudentsPayload) =>
      importStudents(payload.data, payload.signal),
    meta: {
      invalidateQueries: [studentsQueryKeys.lists()],
    },
  });
}
