import { createFileRoute, redirect } from "@tanstack/react-router";
import { routeShell } from "@/lib/route-shell";

export const Route = createFileRoute("/cpns")({
  staticData: routeShell.public,
  beforeLoad: () => { redirect({ to: "/dashboard", replace: true, throw: true }); },
});
