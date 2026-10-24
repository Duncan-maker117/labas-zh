const destinations = [
  "/dashboard", "/admin", "/admin/activity", "/admin/users", "/admin/featured",
  "/admin/credits", "/admin/jobs", "/admin/moderation", "/admin/settings",
] as const;

/** Only known internal destinations may be used for a post-login redirect. */
export function getLoginDestination(value: unknown): (typeof destinations)[number] {
  const path = typeof value === "string" ? value.replace(/\/$/, "") : "";
  return destinations.find((destination) => destination === path) ?? "/dashboard";
}
