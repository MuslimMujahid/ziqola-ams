export const tenantQueryKeys = {
  all: ["tenants"] as const,
  availability: (schoolCode: string) =>
    [...tenantQueryKeys.all, "availability", { schoolCode }] as const,
  emailAvailability: (email: string) =>
    [...tenantQueryKeys.all, "emailAvailability", { email }] as const,
};
