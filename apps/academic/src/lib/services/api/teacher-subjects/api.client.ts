import { clientApi } from "@/lib/services/api/api";
import type {
  GetTeacherSubjectsResponse,
  GetTeacherSubjectsVars,
} from "./teacher-subjects.types";

async function getTeacherSubjects(params: GetTeacherSubjectsVars) {
  const response = await clientApi.get<GetTeacherSubjectsResponse>(
    "/class-subjects/teacher-subjects",
    { params },
  );
  return response.data;
}

export { getTeacherSubjects };
