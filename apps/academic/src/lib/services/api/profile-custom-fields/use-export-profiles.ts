import { useMutation } from "@tanstack/react-query";

import { exportProfiles } from "./api.client";
import type { ExportProfilesVars } from "./profile-custom-fields.types";

export function useExportProfiles() {
  return useMutation({
    mutationFn: (vars: ExportProfilesVars) => exportProfiles(vars),
  });
}
