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
    const shouldCheckAcademicContext =
      role === "ADMIN_STAFF" || role === "PRINCIPAL";

    if (role && location.pathname.startsWith("/dashboard")) {
      if (shouldCheckAcademicContext) {
        const context = await getAcademicContextFn();
        const needsSetup = !context?.year;

        if (needsSetup) {
          throw redirect({
            to: "/onboarding/academic-setup",
          });
        }
      }

      const dashboardRoute = getDashboardRoute(role);
      const isDashboardRoute = location.pathname === dashboardRoute;
      const isDashboardSubRoute = location.pathname.startsWith(
        `${dashboardRoute}/`,
      );

      if (!isDashboardRoute && !isDashboardSubRoute) {
        throw redirect({
          to: dashboardRoute,
        });
      }
    }

    return { user };
  },
});
