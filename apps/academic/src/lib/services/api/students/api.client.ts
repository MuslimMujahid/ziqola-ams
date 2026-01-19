import { clientApi } from "@/lib/services/api/api";
import type {
  CreateStudentProfileResponse,
  CreateStudentProfileVars,
  GetStudentsResponse,
  GetStudentsVars,
  UpdateStudentProfileResponse,
  UpdateStudentProfileVars,
} from "./students.types";

async function getStudents(params?: GetStudentsVars) {
  const response = await clientApi.get<GetStudentsResponse>(
    "/profiles/student",
    { params },
  );
  return response.data;
}

async function createStudentProfile(vars: CreateStudentProfileVars) {
  const response = await clientApi.post<CreateStudentProfileResponse>(
    "/profiles/student",
    vars,
  );
  return response.data.data;
}

async function updateStudentProfile(vars: UpdateStudentProfileVars) {
  const response = await clientApi.patch<UpdateStudentProfileResponse>(
    `/profiles/student/${vars.id}`,
    {
      nis: vars.nis,
      nisn: vars.nisn,
      additionalIdentifiers: vars.additionalIdentifiers,
    },
  );
  return response.data.data;
}

export { getStudents, createStudentProfile, updateStudentProfile };
