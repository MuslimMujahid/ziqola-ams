const academicQueryKeys = {
  all: ["academic"] as const,
  context: () => [...academicQueryKeys.all, "context"] as const,
};

export { academicQueryKeys };
