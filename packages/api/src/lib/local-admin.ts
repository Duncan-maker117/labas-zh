import { asc, eq, sql } from "drizzle-orm";
import { adminAuditLog, db, user } from "@labas/db";
import { throwForbidden, throwNotFound } from "./errors";

/** Local operator tool only. This is deliberately not exposed as an HTTP API. */
export async function getLocalAdminCandidates() {
  const users = await db.select({ id: user.id, name: user.name, email: user.email, role: user.role, suspended: user.suspended })
    .from(user).orderBy(asc(user.createdAt));
  return { hasAdministrator: users.some((row) => row.role === "admin"), users: users.filter((row) => !row.suspended) };
}

export async function grantInitialLocalAdmin(userId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(770013)`);
    const [target] = await tx.select({ id: user.id, role: user.role, suspended: user.suspended })
      .from(user).where(eq(user.id, userId)).for("update");
    if (!target) throwNotFound("User");
    if (target.suspended) throwForbidden("Suspended accounts cannot become administrators");
    if (target.role === "admin") return { status: "already_admin" as const };
    const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.role, "admin")).limit(1);
    if (existing) throwForbidden("An administrator already exists. Use the administration panel to manage roles");
    await tx.update(user).set({ role: "admin" }).where(eq(user.id, userId));
    await tx.insert(adminAuditLog).values({
      adminUserId: userId, targetUserId: userId, action: "bootstrap_admin_local",
      details: { source: "local_operator", previousRole: target.role, newRole: "admin" },
    });
    return { status: "created" as const };
  });
}
