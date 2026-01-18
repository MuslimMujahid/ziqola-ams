export const tenantQueryKeys = {
  all: ["tenants"] as const,
  availability: (schoolCode: string) =>
    [...tenantQueryKeys.all, "availability", { schoolCode }] as const,
};
