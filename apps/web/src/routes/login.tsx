import { createFileRoute } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";
import { routeShell } from "@/lib/route-shell";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/login")({
  staticData: routeShell.public,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/30">
      <div className="w-full max-w-md flex flex-col items-center">
        <BrandLogo className="h-20 w-60 max-w-full mb-8" />
        <SignInForm />
      </div>
    </div>
  );
}
