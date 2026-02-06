import { clientApi } from "@/lib/services/api/api";
import type {
  CreateStudentProfileResponse,
  CreateStudentProfileVars,
  GetStudentsResponse,
  GetStudentsVars,
  GetStudentProfileResponse,
  ImportStudentsResponse,
  ImportStudentsVars,
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

async function getStudentProfileByUserId(userId: string) {
  const response = await clientApi.get<GetStudentProfileResponse>(
    `/profiles/student/user/${userId}`,
  );
  return response.data;
}

async function createStudentProfile(vars: CreateStudentProfileVars) {
  const response = await clientApi.post<CreateStudentProfileResponse>(
    "/profiles/student",
    {
      userId: vars.userId,
      nis: vars.nis,
      nisn: vars.nisn,
      gender: vars.gender,
      dateOfBirth: vars.dateOfBirth,
      phoneNumber: vars.phoneNumber,
    },
  );
  return response.data.data;
}

async function updateStudentProfile(vars: UpdateStudentProfileVars) {
  const response = await clientApi.patch<UpdateStudentProfileResponse>(
    `/profiles/student/${vars.id}`,
    {
      nis: vars.nis,
      nisn: vars.nisn,
      gender: vars.gender,
      dateOfBirth: vars.dateOfBirth,
      phoneNumber: vars.phoneNumber,
    },
  );
  return response.data.data;
}

async function getStudentImportTemplate() {
  const response = await clientApi.get<Blob>("/profiles/student/template", {
    responseType: "blob",
  });
  return response.data;
}

async function importStudents(vars: ImportStudentsVars, signal?: AbortSignal) {
  const response = await clientApi.post<ImportStudentsResponse>(
    "/profiles/student/import",
    vars,
    { signal },
  );
  return response.data;
}

export { getStudents, createStudentProfile, updateStudentProfile };
export { getStudentProfileByUserId };
export { getStudentImportTemplate, importStudents };
