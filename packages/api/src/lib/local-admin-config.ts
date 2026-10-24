/** Reject other checkouts/environments before a database connection is opened. */
export function getLocalAdminDatabaseUrl(
  server: Record<string, string | undefined>,
  compose: Record<string, string | undefined>,
  overrides: Record<string, string | undefined> = {},
) {
  const password = compose.LABAS_DB_PASSWORD;
  const expected = `postgresql://labas_app:${password}@127.0.0.1:15432/labas_local`;
  if (!password || !/^[a-f0-9]{64}$/.test(password)
    || server.NODE_ENV !== "development" || server.DATABASE_URL !== expected
    || (overrides.NODE_ENV && overrides.NODE_ENV !== "development")
    || (overrides.DATABASE_URL && overrides.DATABASE_URL !== expected)) {
    throw new Error("This tool only supports this project's isolated local development database");
  }
  return expected;
}
