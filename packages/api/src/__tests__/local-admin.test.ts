import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../../../db/src/schema";
import { closeTestPGlite, getTestPGlite } from "./test-setup";
import type { Context } from "../context";

let db: ReturnType<typeof drizzle<typeof schema>>;
let setup: typeof import("../lib/local-admin");
let authCheck: (id: string) => Promise<{ ok: boolean }>;
let sequence = 0;
async function addUser(suspended = false) {
  const id = `owner-${++sequence}`;
  await db.insert(schema.user).values({ id, name: id, email: `${id}@example.invalid`, suspended });
  return id;
}
beforeAll(async () => {
  db = drizzle(await getTestPGlite(), { schema });
  mock.module("@labas/db", () => ({ db, ...schema }));
  setup = await import("../lib/local-admin");
  const { adminProcedure, router } = await import("../index");
  const api = router({ ping: adminProcedure.query(() => ({ ok: true })) });
  authCheck = (id) => api.createCaller({ session: { user: { id } }, auth: null } as Context).ping();
});
beforeEach(async () => {
  await db.delete(schema.adminAuditLog);
  await db.update(schema.user).set({ role: "user" });
});
afterAll(closeTestPGlite);

describe("first local administrator", () => {
  it("grants only the explicitly selected account and records the previous role", async () => {
    const selected = await addUser();
    const other = await addUser();
    await expect(authCheck(selected)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await setup.grantInitialLocalAdmin(selected);
    await expect(authCheck(selected)).resolves.toEqual({ ok: true });
    await expect(authCheck(other)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const [event] = await db.select().from(schema.adminAuditLog).where(eq(schema.adminAuditLog.targetUserId, selected));
    expect(event?.action).toBe("bootstrap_admin_local");
    expect(event?.details).toMatchObject({ previousRole: "user", newRole: "admin" });
  });
  it("cannot be used to promote more accounts after the first administrator", async () => {
    const first = await addUser();
    const second = await addUser();
    await setup.grantInitialLocalAdmin(first);
    await expect(setup.grantInitialLocalAdmin(second)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(setup.grantInitialLocalAdmin(first)).resolves.toEqual({ status: "already_admin" });
    expect(await db.select().from(schema.adminAuditLog)).toHaveLength(1);
  });
  it("admits only one first administrator during concurrent attempts", async () => {
    const first = await addUser();
    const second = await addUser();
    const results = await Promise.allSettled([setup.grantInitialLocalAdmin(first), setup.grantInitialLocalAdmin(second)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.select().from(schema.user).where(eq(schema.user.role, "admin"))).toHaveLength(1);
  });
  it("refuses missing and suspended accounts", async () => {
    await expect(setup.grantInitialLocalAdmin("does-not-exist")).rejects.toMatchObject({ code: "NOT_FOUND" });
    const suspended = await addUser(true);
    await expect(setup.grantInitialLocalAdmin(suspended)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const candidates = await setup.getLocalAdminCandidates();
    expect(candidates.users.some((row) => row.id === suspended)).toBe(false);
    expect(candidates.hasAdministrator).toBe(false);
  });
  it("blocks a suspended administrator at the server boundary", async () => {
    const selected = await addUser();
    await setup.grantInitialLocalAdmin(selected);
    await db.update(schema.user).set({ suspended: true }).where(eq(schema.user.id, selected));
    await expect(authCheck(selected)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
