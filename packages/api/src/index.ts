import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import type { Context } from "./context";
import { db } from "@labas/db";
import { user } from "@labas/db";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

// Global logging for all procedures
const baseProcedure = t.procedure.use(({ ctx, path, type, next }) => {
  const start = Date.now();
  logger.info(`${type.toUpperCase()} ${path}`, { userId: ctx.session?.user.id });
  return next().finally(() => {
    logger.info(`${type.toUpperCase()} ${path} completed`, {
      userId: ctx.session?.user.id,
      durationMs: Date.now() - start,
    });
  });
});

export const publicProcedure = baseProcedure;

export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [u] = await db.select().from(user).where(eq(user.id, ctx.session.user.id)).limit(1);
  if (!u || u.role !== "admin" || u.suspended) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx: { ...ctx, adminUser: u } });
});
