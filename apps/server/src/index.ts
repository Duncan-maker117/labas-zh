import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@labas/api/context";
import { appRouter } from "@labas/api/routers/index";
import { recordBounce } from "@labas/api/lib/bounce";
import { auth } from "@labas/auth";
import { env } from "@labas/env/server";
import { db } from "@labas/db";
import { generationQueue } from "@labas/api/queue";
import { withRequestId } from "@labas/api/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { timingSafeEqual } from "node:crypto";

const app = new Hono();

app.use("/*", async (c, next) => {
  const reqId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const reqLogger = withRequestId(reqId);
  const start = Date.now();

  c.res.headers.set("x-request-id", reqId);
  reqLogger.info(`${c.req.method} ${c.req.path}`);

  await next();

  const duration = Date.now() - start;
  reqLogger.info(`${c.req.method} ${c.req.path} ${c.res.status}`, { durationMs: duration });
});

app.use("/*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("X-XSS-Protection", "0");
  c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
});

app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

// Webhook endpoint for email bounce notifications from ESPs (SendGrid, Mailgun, SES)
app.post("/api/webhooks/email-bounce", async (c) => {
  const secret = env.EMAIL_BOUNCE_WEBHOOK_SECRET;
  if (!secret) return c.notFound();
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(c.req.header("Authorization") ?? "");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = await c.req.json<{ Email?: string; email?: string; Reason?: string; reason?: string }>();
  const email = body.Email ?? body.email;
  const reason = body.Reason ?? body.reason;

  if (!email) {
    return c.json({ error: "Missing email field" }, 400);
  }

  await recordBounce(email, reason);
  return c.json({ success: true }, 200);
});

app.get("/sitemap.xml", (c) => {
  const baseUrl = new URL(env.CORS_ORIGIN).origin;
  const urls = [
    { loc: `${baseUrl}/`, changefreq: "weekly", priority: "1.0" },
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;
  return c.text(sitemap, 200, { "Content-Type": "application/xml" });
});

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/health/ready", async (c) => {
  try {
    // Verify the migrated schema, not just whether PostgreSQL accepts connections.
    await db.execute('select 1 from "platform_config" limit 1');
    const redis = await generationQueue.client;
    await redis.ping();
    return c.json({ status: "ok", database: "ok", queue: "ok" });
  } catch {
    return c.json({ status: "unavailable" }, 503);
  }
});

export { app };
export default {
  port: env.PORT,
  hostname: env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
  fetch: app.fetch,
};
