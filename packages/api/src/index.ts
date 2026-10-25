import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import type { Context } from "./context";
import { db } from "@labas/db";
import { user } from "@labas/db";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    // This is a transport boundary: development responses must be safe too.
    return {
      message: error.code === "INTERNAL_SERVER_ERROR" ? "Internal server error" : shape.message,
      code: shape.code,
      data: {
        code: shape.data.code,
        httpStatus: shape.data.httpStatus,
        path: shape.data.path,
      },
    };
  },
});

export const router = t.router;

// Global logging for all procedures
const baseProcedure = t.procedure.use(({ ctx, path, type, next }) => {
  const start = Date.now();
  logger.info(`${type.toUpperCase()} ${path}`, { userId: ctx.session?.user.id });
  return next().then((result) => {
    if (!result.ok && result.error.code === "INTERNAL_SERVER_ERROR") {
      // Record diagnostics without copying SQL, parameters, or credentials into logs.
      let cause: unknown = result.error.cause;
      let databaseCode: string | undefined;
      for (let depth = 0; depth < 5 && cause instanceof Error; depth++) {
        if ("code" in cause && typeof cause.code === "string" && /^[0-9A-Z]{5}$/.test(cause.code)) {
          databaseCode = cause.code;
        }
        cause = cause.cause;
      }
      logger.error("Procedure failed", { path, type, code: result.error.code, databaseCode });
    }
    return result;
  }).finally(() => {
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
