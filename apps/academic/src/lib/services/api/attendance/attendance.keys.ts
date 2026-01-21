export const attendanceQueryKeys = {
  all: ["attendance"] as const,
  sessions: () => [...attendanceQueryKeys.all, "session"] as const,
  session: (sessionId: string) =>
    [...attendanceQueryKeys.sessions(), sessionId] as const,
};
