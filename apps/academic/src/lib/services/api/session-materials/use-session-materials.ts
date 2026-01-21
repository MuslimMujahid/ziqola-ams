import { useQuery } from "@tanstack/react-query";

import { getSessionMaterials } from "./api.client";
import { sessionMaterialsQueryKeys } from "./session-materials.keys";
import type { SessionMaterial } from "./session-materials.types";

type UseSessionMaterialsOptions = {
  enabled?: boolean;
};

export function useSessionMaterials(
  sessionId: string,
  options?: UseSessionMaterialsOptions,
) {
  return useQuery<SessionMaterial>({
    queryKey: sessionMaterialsQueryKeys.session(sessionId),
    queryFn: () => getSessionMaterials(sessionId),
    enabled: options?.enabled ?? Boolean(sessionId),
  });
}
