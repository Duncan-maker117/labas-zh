import { describe, expect, it } from "bun:test";
import { getLocalAdminDatabaseUrl } from "../lib/local-admin-config";

const password = "a".repeat(64);
const localUrl = `postgresql://labas_app:${password}@127.0.0.1:15432/labas_local`;
const server = { NODE_ENV: "development", DATABASE_URL: localUrl };
const compose = { LABAS_DB_PASSWORD: password };
describe("local administrator database guard", () => {
  it("accepts this project's isolated development database", () => {
    expect(getLocalAdminDatabaseUrl(server, compose)).toBe(localUrl);
  });
  it("refuses production, remote databases, and environment overrides", () => {
    for (const DATABASE_URL of [localUrl.replace("127.0.0.1", "db.example.com"), localUrl.replace("15432", "5432"), localUrl.replace("labas_local", "production"), localUrl.replace(password, "other-password")]) {
      expect(() => getLocalAdminDatabaseUrl({ ...server, DATABASE_URL }, compose)).toThrow();
    }
    expect(() => getLocalAdminDatabaseUrl({ ...server, NODE_ENV: "production" }, compose)).toThrow();
    expect(() => getLocalAdminDatabaseUrl(server, compose, { DATABASE_URL: "postgresql://remote/db" })).toThrow();
    expect(() => getLocalAdminDatabaseUrl(server, compose, { NODE_ENV: "production" })).toThrow();
  });
});
