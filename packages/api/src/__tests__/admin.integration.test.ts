import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { getTestPGlite, createTestUserData, closeTestPGlite } from "./test-setup";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../../db/src/schema";

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
};

mock.module("@labas/env/server", () => ({
  env: MOCK_ENV,
}));

const TEST_QUESTION_ID = "b0000000-1000-4000-8000-000000000001";
const TEST_PACKAGE_ID = "a0000000-1000-4000-8000-000000000001";

describe("Admin Integration", () => {
  let db: ReturnType<typeof drizzle>;
  let adminCaller: Awaited<ReturnType<typeof import("../routers/admin").adminRouter.createCaller>> | null = null;
  let userCaller: Awaited<ReturnType<typeof import("../routers/admin").adminRouter.createCaller>> | null = null;
  let userData: Awaited<ReturnType<typeof createTestUserData>>;
  let adminRouter: typeof import("../routers/admin").adminRouter;

  beforeAll(async () => {
    userData = await createTestUserData();
    const pg = await getTestPGlite();
    db = drizzle(pg, { schema });

    mock.module("@labas/db", () => ({
      db,
      ...schema,
    }));

    adminRouter = (await import("../routers/admin")).adminRouter;

    adminCaller = adminRouter.createCaller({
      session: {
        user: { id: userData.user1.id, name: userData.user1.name, email: userData.user1.email, emailVerified: false, image: null },
        expiresAt: new Date("2099-01-01"),
      },
      auth: null,
    });

    userCaller = adminRouter.createCaller({
      session: {
        user: { id: userData.user2.id, name: userData.user2.name, email: userData.user2.email, emailVerified: false, image: null },
        expiresAt: new Date("2099-01-01"),
      },
      auth: null,
    });
  });

  afterAll(async () => {
    await closeTestPGlite();
  });

  // ── Schema Verification ─────────────────────────────────────

  describe("Schema", () => {
    it("user table has role column defaulting to user", async () => {
      const rows = await db.execute(`SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'role'`);
      expect(rows.rows.length).toBe(1);
      expect(rows.rows[0].column_default).toContain("user");
    });

    it("user table has suspended column defaulting to false", async () => {
      const rows = await db.execute(`SELECT column_name FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'suspended'`);
      expect(rows.rows.length).toBe(1);
    });

    it("question table has is_featured column", async () => {
      const rows = await db.execute(`SELECT column_name FROM information_schema.columns WHERE table_name = 'question' AND column_name = 'is_featured'`);
      expect(rows.rows.length).toBe(1);
    });

    it("user_credit table exists", async () => {
      const rows = await db.execute(`SELECT table_name FROM information_schema.tables WHERE table_name = 'user_credit'`);
      expect(rows.rows.length).toBe(1);
    });

    it("credit_transaction table exists", async () => {
      const rows = await db.execute(`SELECT table_name FROM information_schema.tables WHERE table_name = 'credit_transaction'`);
      expect(rows.rows.length).toBe(1);
    });

    it("admin_audit_log table exists", async () => {
      const rows = await db.execute(`SELECT table_name FROM information_schema.tables WHERE table_name = 'admin_audit_log'`);
      expect(rows.rows.length).toBe(1);
    });
  });

  // ── Admin Middleware ─────────────────────────────────────────

  describe("Middleware", () => {
    it("non-admin user gets FORBIDDEN on admin procedures", async () => {
      try {
        await userCaller!.listUsers({});
        expect.unreachable("Should have thrown");
      } catch (e: any) {
        expect(e.code).toBe("FORBIDDEN");
      }
    });

    it("unauthenticated user gets UNAUTHORIZED on admin procedures", async () => {
      const publicCaller = adminRouter.createCaller({
        session: null,
        auth: null,
      });
      try {
        await publicCaller.listUsers({});
        expect.unreachable("Should have thrown");
      } catch (e: any) {
        expect(e.code).toBe("UNAUTHORIZED");
      }
    });
  });

  // ── User Management ─────────────────────────────────────────

  describe("User Management", () => {
    it("lists users with pagination", async () => {
      const result = await adminCaller!.listUsers({});
      expect(result.users.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it("lists users with search", async () => {
      const result = await adminCaller!.listUsers({ search: "Test" });
      expect(result.users.length).toBeGreaterThanOrEqual(1);
    });

    it("suspends a user", async () => {
      const suspended = await adminCaller!.suspendUser({ userId: userData.user2.id, suspended: true });
      expect(suspended.suspended).toBe(true);
    });

    it("unsuspends a user", async () => {
      const unsuspended = await adminCaller!.suspendUser({ userId: userData.user2.id, suspended: false });
      expect(unsuspended.suspended).toBe(false);
    });

    it("cannot suspend self", async () => {
      try {
        await adminCaller!.suspendUser({ userId: userData.user1.id, suspended: true });
        expect.unreachable("Should have thrown");
      } catch (e: any) {
        expect(e.code).toBe("FORBIDDEN");
      }
    });
  });

  // ── Role Management ─────────────────────────────────────────

  describe("Role Management", () => {
    it("sets another user to admin", async () => {
      const updated = await adminCaller!.setUserRole({ userId: userData.user2.id, role: "admin" });
      expect(updated.role).toBe("admin");
      // Restore
      await adminCaller!.setUserRole({ userId: userData.user2.id, role: "user" });
    });

    it("cannot change own role", async () => {
      try {
        await adminCaller!.setUserRole({ userId: userData.user1.id, role: "user" });
        expect.unreachable("Should have thrown");
      } catch (e: any) {
        expect(e.code).toBe("FORBIDDEN");
      }
    });
  });

  // ── Credit Management ───────────────────────────────────────

  describe("Credit Management", () => {
    beforeAll(async () => {
      await db.insert(schema.userCredit).values({
        userId: userData.user2.id, tokenBalance: 10000,
      }).onConflictDoNothing();
    });

    it("gets user credit balance", async () => {
      const credit = await adminCaller!.getCreditBalance({ userId: userData.user2.id });
      expect(credit.tokenBalance).toBe(10000);
    });

    it("adjusts credit (add)", async () => {
      const result = await adminCaller!.adjustCredit({ userId: userData.user2.id, amount: 5000, description: "Bonus" });
      expect(result.newBalance).toBe(15000);
    });

    it("adjusts credit (deduct)", async () => {
      const result = await adminCaller!.adjustCredit({ userId: userData.user2.id, amount: -3000, description: "Deduct" });
      expect(result.newBalance).toBe(12000);
    });

    it("gets credit transaction history", async () => {
      const history = await adminCaller!.getCreditHistory({ userId: userData.user2.id });
      expect(history.transactions.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Featured Management ─────────────────────────────────────

  describe("Featured Management", () => {
    it("toggles featured on a package", async () => {
      const result = await adminCaller!.toggleFeaturedPackage({ packageId: TEST_PACKAGE_ID });
      expect(result.isFeatured).toBe(true);
      // Toggle back
      await adminCaller!.toggleFeaturedPackage({ packageId: TEST_PACKAGE_ID });
    });

    it("toggles featured on a question", async () => {
      const result = await adminCaller!.toggleFeaturedQuestion({ questionId: TEST_QUESTION_ID });
      expect(result.isFeatured).toBe(true);
      await adminCaller!.toggleFeaturedQuestion({ questionId: TEST_QUESTION_ID });
    });

    it("lists all featured items", async () => {
      await adminCaller!.toggleFeaturedPackage({ packageId: TEST_PACKAGE_ID });
      await adminCaller!.toggleFeaturedQuestion({ questionId: TEST_QUESTION_ID });

      const featured = await adminCaller!.listFeatured();
      expect(featured.packages.length).toBeGreaterThanOrEqual(1);
      expect(featured.questions.length).toBeGreaterThanOrEqual(1);

      await adminCaller!.toggleFeaturedPackage({ packageId: TEST_PACKAGE_ID });
      await adminCaller!.toggleFeaturedQuestion({ questionId: TEST_QUESTION_ID });
    });

    it("returns NOT_FOUND for non-existent package", async () => {
      try {
        await adminCaller!.toggleFeaturedPackage({ packageId: "dddddddd-1000-4000-8000-000000000001" });
        expect.unreachable("Should have thrown");
      } catch (e: any) {
        expect(e.code).toBe("NOT_FOUND");
      }
    });
  });

  // ── Generation Jobs View ────────────────────────────────────

  describe("Generation Jobs", () => {
    beforeAll(async () => {
      // Import the full schema reference
      const fullSchema = await import("../../../db/src/schema");
      try {
        await db.insert(fullSchema.generationJob).values({
          userId: userData.user2.id,
          status: "failed",
          mode: "quick",
          examTypeId: "IELTS",
          sectionTypeId: "READING",
          questionCount: 5,
          tokensUsed: 1000,
        });
      } catch {
        // generationJob may not be in test-setup schema yet - skip
      }
    });

    it("lists all jobs across users", async () => {
      const result = await adminCaller!.listAllJobs({});
      expect(result.jobs).toBeDefined();
    });
  });

  // ── Content Moderation ──────────────────────────────────────

  describe("Content Moderation", () => {
    it("lists latest questions for moderation", async () => {
      const result = await adminCaller!.listLatestQuestions({});
      expect(result.questions.length).toBeGreaterThanOrEqual(1);
    });

    it("toggles public on any question", async () => {
      const result = await adminCaller!.togglePublicAny({ questionId: TEST_QUESTION_ID });
      expect(result.isPublic).toBe(false);
      // Toggle back
      await adminCaller!.togglePublicAny({ questionId: TEST_QUESTION_ID });
    });
  });

  // ── Dashboard Stats ─────────────────────────────────────────

  describe("Dashboard Stats", () => {
    it("returns platform-wide stats", async () => {
      const stats = await adminCaller!.dashboardStats();
      expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
      expect(stats.totalQuestions).toBeGreaterThanOrEqual(1);
      expect(stats.totalPackages).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows only public language content in the learner dashboard", async () => {
    await db.insert(schema.examType).values({ id: "CPNS", name: "CPNS", language: "Indonesian" });
    const [visible, privatePack, cpnsPack] = await db.insert(schema.testPackage).values([
      { title: "Public language", examTypeId: "IELTS", creatorUserId: userData.user1.id, isPublic: true, isFeatured: true },
      { title: "Private language", examTypeId: "IELTS", creatorUserId: userData.user1.id, isPublic: false, isFeatured: true },
      { title: "Historical CPNS", examTypeId: "CPNS", creatorUserId: userData.user1.id, isPublic: true, isFeatured: true },
    ]).returning();
    await db.insert(schema.question).values([
      { examTypeId: "IELTS", sectionTypeId: "READING", passageText: "Private passage", questionText: "Private?", correctAnswer: "A", format: "multiple_choice", creatorUserId: userData.user1.id, isPublic: false, isFeatured: true },
      { examTypeId: "CPNS", sectionTypeId: "READING", passageText: "Historical passage", questionText: "Historical?", correctAnswer: "A", format: "multiple_choice", creatorUserId: userData.user1.id, isPublic: true, isFeatured: true },
    ]);

    const result = await userCaller!.getDashboardFeatured();
    const ids = result.packages.map((pack) => pack.id);
    expect(ids).toContain(visible!.id);
    expect(ids).not.toContain(privatePack!.id);
    expect(ids).not.toContain(cpnsPack!.id);
    expect(result.questionsTotal).toBe(0);
  });
});
