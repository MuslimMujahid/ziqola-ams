import { getCurrentUserFn } from "@/lib/services/api/auth/api.server";
import { getDashboardRoute } from "@/lib/utils/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn();

    if (!user) {
      throw redirect({
        to: "/auth/login",
      });
    }

    const role = user.role;
    if (role && location.pathname.startsWith("/dashboard")) {
      const dashboardRoute = getDashboardRoute(role);

      if (location.pathname !== dashboardRoute) {
        throw redirect({
          to: dashboardRoute,
        });
      }
    }

    return { user };
  },
});
