import { clientApi } from "@/lib/services/api/api";
import type {
  CreateTeacherProfileResponse,
  CreateTeacherProfileVars,
  GetTeacherProfileResponse,
  GetTeacherProfilesResponse,
  GetTeacherProfilesVars,
  UpdateTeacherProfileResponse,
  UpdateTeacherProfileVars,
} from "./teachers.types";

async function getTeacherProfiles(params?: GetTeacherProfilesVars) {
  const response = await clientApi.get<GetTeacherProfilesResponse>(
    "/profiles/teacher",
    { params },
  );
  return response.data;
}

async function createTeacherProfile(vars: CreateTeacherProfileVars) {
  const response = await clientApi.post<CreateTeacherProfileResponse>(
    "/profiles/teacher",
    vars,
  );
  return response.data.data;
}

async function getTeacherProfileById(id: string) {
  const response = await clientApi.get<GetTeacherProfileResponse>(
    `/profiles/teacher/${id}`,
  );
  return response.data;
}

async function updateTeacherProfile(vars: UpdateTeacherProfileVars) {
  const response = await clientApi.patch<UpdateTeacherProfileResponse>(
    `/profiles/teacher/${vars.id}`,
    {
      nip: vars.nip,
      nuptk: vars.nuptk,
      hiredAt: vars.hiredAt,
      additionalIdentifiers: vars.additionalIdentifiers,
    },
  );
  return response.data.data;
}

export {
  getTeacherProfiles,
  getTeacherProfileById,
  createTeacherProfile,
  updateTeacherProfile,
};
