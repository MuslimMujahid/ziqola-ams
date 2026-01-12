import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  QueryKey,
} from "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidateQueries: QueryKey[];
    };
  }
}

export function getContext() {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onSettled: (_, __, ___, _____, ctx) => {
        if (ctx.meta?.invalidateQueries) {
          for (const queryKey of ctx.meta.invalidateQueries) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      },
    }),
  });

  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
