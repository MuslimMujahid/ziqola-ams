import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { getTenantConfigurationsBatch } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type {
  BatchConfigurationsVars,
  ConfigurationBatchType,
  TenantConfigurationsBatchResponse,
} from "./profile-custom-fields.types";

type UseTenantConfigurationsBatchOptions = {
  enabled?: boolean;
};

function normalizeTypes(types: ConfigurationBatchType[]) {
  return [...types].sort();
}

export function useTenantConfigurationsBatch(
  tenantId: string,
  types: ConfigurationBatchType[],
  options: UseTenantConfigurationsBatchOptions = {},
) {
  const normalizedTypes = normalizeTypes(types);
  const typesKey = normalizedTypes.join("|");

  return useQuery<TenantConfigurationsBatchResponse>({
    queryKey: profileCustomFieldsKeys.tenantConfigurationsBatch(
      tenantId,
      typesKey,
    ),
    queryFn: () =>
      getTenantConfigurationsBatch({
        tenantId,
        types: normalizedTypes,
      } satisfies BatchConfigurationsVars),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}

export function useSuspenseTenantConfigurationsBatch(
  tenantId: string,
  types: ConfigurationBatchType[],
) {
  const normalizedTypes = normalizeTypes(types);
  const typesKey = normalizedTypes.join("|");

  return useSuspenseQuery<TenantConfigurationsBatchResponse>({
    queryKey: profileCustomFieldsKeys.tenantConfigurationsBatch(
      tenantId,
      typesKey,
    ),
    queryFn: () =>
      getTenantConfigurationsBatch({
        tenantId,
        types: normalizedTypes,
      } satisfies BatchConfigurationsVars),
  });
}
