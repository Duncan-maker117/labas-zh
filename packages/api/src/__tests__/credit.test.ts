import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { getTestPGlite, createTestUserData, closeTestPGlite } from "./test-setup";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../../db/src/schema";
import { eq } from "drizzle-orm";

const MOCK_ENV = {
  DATABASE_URL: "postgres://localhost:5432/test",
  BETTER_AUTH_SECRET: "test-secret-key-32-chars-long!!!!",
  BETTER_AUTH_URL: "http://localhost:3000",
  CORS_ORIGIN: "http://localhost:5173",
  API_KEY_ENCRYPTION_KEY: "test-encryption-key-32-chars!!",
  REDIS_URL: "redis://localhost:6379",
  SMTP_HOST: "smtp.test.com",
  SMTP_PORT: "587",
  SMTP_USER: "test@test.com",
  SMTP_PASS: "password123",
  SMTP_FROM: "test@test.com",
  PLATFORM_AI_API_KEY: "sk-test-platform-key",
  PLATFORM_AI_BASE_URL: "https://api.openai.com/v1",
  PLATFORM_AI_MODEL: "gpt-4o-mini",
  DEFAULT_SIGNUP_CREDIT_TOKENS: "50000",
  FREE_CREDITS_ENABLED: true,
  FREE_CREDITS_MAX_POOL: 1000000,
};

mock.module("@labas/env/server", () => ({
  env: MOCK_ENV,
}));

let userIdCounter = 0;
function makeUserId(label: string) {
  userIdCounter++;
  return `credit-${label}-${userIdCounter}`;
}

describe("Credit Utility", () => {
  let db: ReturnType<typeof drizzle>;
  let credit: typeof import("../lib/credit");
  let userData: Awaited<ReturnType<typeof createTestUserData>>;

  beforeAll(async () => {
    userData = await createTestUserData();
    const pg = await getTestPGlite();
    db = drizzle(pg, { schema });

    mock.module("@labas/db", () => ({
      db,
      ...schema,
    }));

    credit = await import("../lib/credit");
  });

  afterAll(async () => {
    await closeTestPGlite();
  });

  // ── Credit Deduction ──────────────────────────────────────

  describe("deductCredit", () => {
    it("does not overdraw credits when deductions arrive concurrently", async () => {
      const uid = makeUserId("concurrent");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });
      await db.insert(schema.userCredit).values({ userId: uid, tokenBalance: 1000 });
      const results = await Promise.allSettled([credit.deductCredit(uid, 800), credit.deductCredit(uid, 800)]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect((await credit.getUserCredit(uid)).tokenBalance).toBe(200);
    });
    it("deducts tokens from balance", async () => {
      const uid = makeUserId("deduct");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });
      await db.insert(schema.userCredit).values({ userId: uid, tokenBalance: 5000 });

      const result = await credit.deductCredit(uid, 1000);
      expect(result.newBalance).toBe(4000);

      const [updated] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, uid)).limit(1);
      expect(updated.tokenBalance).toBe(4000);
    });

    it("creates credit transaction record", async () => {
      const uid = makeUserId("txn");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });
      await db.insert(schema.userCredit).values({ userId: uid, tokenBalance: 5000 });

      await credit.deductCredit(uid, 500);

      const txns = await db.select().from(schema.creditTransaction).where(eq(schema.creditTransaction.userId, uid));
      expect(txns.length).toBe(1);
      expect(txns[0].amount).toBe(-500);
      expect(txns[0].type).toBe("generation_spend");
    });

    it("throws when user has no credit balance", async () => {
      const uid = makeUserId("nobalance");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });

      try {
        await credit.deductCredit(uid, 100);
        expect.unreachable("Should have thrown");
      } catch (e: any) {
        expect(e.code).toBe("BAD_REQUEST");
        expect(e.message).toContain("Insufficient credits");
      }
    });

    it("handles insufficient balance", async () => {
      const uid = makeUserId("lowbal");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });
      await db.insert(schema.userCredit).values({ userId: uid, tokenBalance: 100 });

      try {
        await credit.deductCredit(uid, 500);
        expect.unreachable("Should have thrown");
      } catch (e: any) {
        expect(e.code).toBe("BAD_REQUEST");
        expect(e.message).toContain("Insufficient credits");
      }
    });
  });

  // ── getUserCredit ─────────────────────────────────────────

  describe("getUserCredit", () => {
    it("returns credit info for user with balance", async () => {
      const uid = makeUserId("getcred");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });
      await db.insert(schema.userCredit).values({ userId: uid, tokenBalance: 3000 });

      const info = await credit.getUserCredit(uid);
      expect(info.tokenBalance).toBe(3000);
    });

    it("returns zero for user without credit row", async () => {
      const uid = makeUserId("nored");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });

      const info = await credit.getUserCredit(uid);
      expect(info.tokenBalance).toBe(0);
    });
  });

  // ── isUserSuspended ───────────────────────────────────────

  describe("isUserSuspended", () => {
    it("returns false for active user", async () => {
      const suspended = await credit.isUserSuspended(userData.user2.id);
      expect(suspended).toBe(false);
    });

    it("returns true for suspended user", async () => {
      await db.update(schema.user).set({ suspended: true }).where(eq(schema.user.id, userData.user2.id));

      const suspended = await credit.isUserSuspended(userData.user2.id);
      expect(suspended).toBe(true);

      await db.update(schema.user).set({ suspended: false }).where(eq(schema.user.id, userData.user2.id));
    });
  });

  // ── ensureUserCreditRow ───────────────────────────────────

  describe("ensureUserCreditRow", () => {
    it("creates row if not exists", async () => {
      const uid = makeUserId("ensure");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });

      await credit.ensureUserCreditRow(uid);

      const [row] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, uid)).limit(1);
      expect(row).toBeDefined();
      expect(row.tokenBalance).toBe(0);
    });
  });

  describe("autoRefillIfEligible", () => {
    it("does not grant the initial allowance twice on concurrent reads", async () => {
      const uid = makeUserId("refill-race");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });
      const results = await Promise.all([credit.autoRefillIfEligible(uid), credit.autoRefillIfEligible(uid)]);
      expect(results.filter((result) => result.refilled)).toHaveLength(1);
      expect((await credit.getUserCredit(uid)).tokenBalance).toBe(50000);
    });
    it("does not treat a reservation refund as newly distributed credit or a refill", async () => {
      const uid = makeUserId("settled");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });
      const before = await credit.getPoolUsage();
      await db.insert(schema.creditTransaction).values({ userId: uid, amount: 25000, type: "generation_settlement", description: "generation:test", tokensUsed: 3000 });
      expect((await credit.getPoolUsage()).totalDistributed).toBe(before.totalDistributed);
      expect(await credit.getLastRefillAt(uid)).toBeNull();
    });
    it("grants initial free credits to new user with zero balance", async () => {
      const uid = makeUserId("refill");
      await db.insert(schema.user).values({ id: uid, name: uid, email: `${uid}@test.com` });

      const result = await credit.autoRefillIfEligible(uid);
      expect(result.refilled).toBe(true);
      expect(result.newBalance).toBe(50000);

      const info = await credit.getUserCredit(uid);
      expect(info.tokenBalance).toBe(50000);
    });
  });
});
