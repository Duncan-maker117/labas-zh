import { uiMessage } from "@/lib/locale";
import { getErrorMessage } from "@/lib/error-utils";
import type { AppRouter } from "@labas/api/routers/index";
import { serverUrl } from "@/lib/server-url";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (
        error instanceof TRPCClientError &&
        (error.data?.code === "UNAUTHORIZED" ||
          error.message.toLowerCase().includes("authentication required"))
      ) {
        return;
      }
      if (query.meta?.handlesError) return;
      toast.error(uiMessage(getErrorMessage(error)), {
        action: {
          label: uiMessage("Retry"),
          onClick: () => { void queryClient.refetchQueries({ queryKey: query.queryKey, exact: true }); },
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${serverUrl}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
