import { env } from "@labas/env/web";

// Vite proxies development requests to the local backend. A phone's loopback
// address belongs to the phone, so it must use the address of the opened page.
export const serverUrl = import.meta.env.DEV ? window.location.origin : env.VITE_SERVER_URL;
