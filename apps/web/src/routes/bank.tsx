import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/bank")({
  validateSearch: z.object({
    mode: z.enum(["soal", "section"]).optional(),
    tab: z.enum(["mine", "public"]).optional(),
    search: z.string().optional(),
    examType: z.string().optional(),
    examProfile: z.string().optional(),
    section: z.string().optional(),
    format: z.string().optional(),
    difficulty: z.coerce.number().optional(),
    visibility: z.enum(["all", "private", "public"]).optional(),
  }).parse,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});
