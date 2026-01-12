import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { useAuthStore } from "@/stores/auth.store";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext();
  const baseContext = {
    ...rqContext,
  };

  const getAuthContext = () => {
    const { accessToken, user, isAuthenticated, hydrated } =
      useAuthStore.getState();

    return {
      accessToken,
      user,
      isAuthenticated,
      hydrated,
    };
  };

  const router = createRouter({
    routeTree,
    context: {
      ...baseContext,
      auth: getAuthContext(),
    },

    defaultPreload: "intent",
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  if (typeof window !== "undefined") {
    const updateAuthContext = () => {
      router.update({
        context: {
          ...baseContext,
          auth: getAuthContext(),
        },
      });
      router.invalidate();
    };

    updateAuthContext();
    useAuthStore.subscribe(updateAuthContext);
  }

  return router;
};
