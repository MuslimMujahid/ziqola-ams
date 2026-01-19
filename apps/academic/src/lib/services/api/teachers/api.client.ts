import { clientApi } from "@/lib/services/api/api";
import type {
  GetTeacherProfilesResponse,
  GetTeacherProfilesVars,
} from "./teachers.types";

async function getTeacherProfiles(params?: GetTeacherProfilesVars) {
  const response = await clientApi.get<GetTeacherProfilesResponse>(
    "/profiles/teacher",
    { params },
  );
  return response.data;
}

export { getTeacherProfiles };
