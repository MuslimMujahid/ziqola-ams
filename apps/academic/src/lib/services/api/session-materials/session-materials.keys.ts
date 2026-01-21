export const sessionMaterialsQueryKeys = {
  all: ["session-materials"] as const,
  sessions: () => [...sessionMaterialsQueryKeys.all, "session"] as const,
  session: (sessionId: string) =>
    [...sessionMaterialsQueryKeys.sessions(), sessionId] as const,
};
