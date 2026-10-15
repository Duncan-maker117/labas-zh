import { useLocale } from "@/lib/locale";
import { createFileRoute } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";
import { routeShell } from "@/lib/route-shell";
import { images } from "@/lib/app-images";

export const Route = createFileRoute("/login")({
  staticData: routeShell.public,
  component: RouteComponent,
});

function RouteComponent() {
  const { ui } = useLocale();
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/30">
      <div className="w-full max-w-md flex flex-col items-center">
        <img src={images.logo.src} alt={ui("Labas Logo")} className="h-20 w-auto mb-8" />
        <SignInForm />
      </div>
    </div>
  );
}
