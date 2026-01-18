import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/_topnavs")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
