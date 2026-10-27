import { createAuthClient } from "better-auth/react";
import { serverUrl } from "./server-url";

export const authClient = createAuthClient({
  baseURL: serverUrl,
  fetchOptions: { timeout: 15_000 },
});
