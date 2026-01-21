const teacherDashboardQueryKeys = {
  all: ["teacher-dashboard"] as const,
  summary: () => [...teacherDashboardQueryKeys.all, "summary"] as const,
};

export { teacherDashboardQueryKeys };
