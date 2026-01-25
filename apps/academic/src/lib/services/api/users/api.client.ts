import { clientApi } from "@/lib/services/api/api";
import type { InviteUserResponse, InviteUserVars } from "./users.types";

export async function inviteUser(
  data: InviteUserVars,
): Promise<InviteUserResponse> {
  const response = await clientApi.post<InviteUserResponse>("/users", data);
  return response.data;
}
