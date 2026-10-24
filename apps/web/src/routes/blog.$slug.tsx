import { createFileRoute } from "@tanstack/react-router";
import { uiMessage } from "@/lib/locale";
import { routeShell } from "@/lib/route-shell";
import { buildSocialMeta, SITE_URL } from "@/lib/site-seo";
import { trpc } from "@/utils/trpc";
import { env } from "@labas/env/web";

export const Route = createFileRoute("/blog/$slug")({
  staticData: routeShell.public,
  beforeLoad: async ({ params, context }) => {
    if (!env.VITE_BLOG_ENABLED) return;
    try {
      await context.queryClient.fetchQuery(
        trpc.blog.postBySlug.queryOptions({ slug: params.slug }),
      );
    } catch {
      // Post not found — let component handle UI
    }
  },
  head: () => ({
    meta: [
      { title: uiMessage("Blog — Labas") },
      ...buildSocialMeta({
        title: uiMessage("Blog — Labas"),
        description: uiMessage("Baca artikel seputar tips dan trik ujian bahasa."),
        url: `${SITE_URL}/blog`,
      }),
    ],
  }),
});
