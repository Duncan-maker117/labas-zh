import { queryFeedbackCopy } from "./query-feedback-copy";

/** Extract a human-readable message from an unknown error value.
 *  Safe to use in tRPC `onError` callbacks where the error type is `unknown`. */
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = err.data;
    if (data && typeof data === "object" && "code" in data && data.code === "INTERNAL_SERVER_ERROR") {
      const saved = typeof window === "undefined" ? null : window.localStorage.getItem("labas-locale");
      return queryFeedbackCopy(saved === "en-US" || saved === "id-ID" ? saved : "zh-CN").failed;
    }
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
  ) {
    return (err as Record<string, unknown>).message as string;
  }
  return "An unexpected error occurred";
}
