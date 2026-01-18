import { getCurrentUserFn } from "@/lib/services/api/auth/api.server";
import { getAcademicContextFn } from "@/lib/services/api/academic/api.server";
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
      const context = await getAcademicContextFn();
      const needsSetup = !context?.year || !context?.period;

      if (needsSetup) {
        throw redirect({
          to: "/onboarding/academic-setup",
        });
      }

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
