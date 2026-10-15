import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cpns")({
  beforeLoad: () => { redirect({ to: "/dashboard", replace: true, throw: true }); },
});
