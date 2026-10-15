import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../../../db/src/schema";
import type { GenerationInput } from "@labas/ai/schemas";

const pg = new PGlite();
const db = drizzle(pg, { schema });
mock.module("@labas/db", () => ({ db, ...schema }));
mock.module("@labas/env/server", () => ({ env: {
  API_KEY_ENCRYPTION_KEY: "a".repeat(32), FREE_CREDITS_ENABLED: true,
  DEFAULT_SIGNUP_CREDIT_TOKENS: 50000, FREE_CREDITS_MAX_POOL: 1000000,
} }));

let generation: typeof import("../lib/platform-generation");
const input: GenerationInput & { _isPlatformGeneration: boolean } = {
  examType: "IELTS", section: "READING", formats: ["multiple_choice"],
  difficulty: 3, topics: ["Science"], questionCount: 5, mode: "quick",
  apiKeyConfig: { baseUrl: "https://example.invalid/v1", apiKey: "secret-test", model: "test", maxTokens: 4096 },
  _isPlatformGeneration: true,
};
let sequence = 0;
async function createUser(balance = 50000) {
  const userId = `platform-${++sequence}`;
  await db.insert(schema.user).values({ id: userId, name: userId, email: `${userId}@test.invalid` });
  await db.insert(schema.userCredit).values({ userId, tokenBalance: balance });
  return userId;
}
beforeAll(async () => {
  process.env.API_KEY_ENCRYPTION_KEY = "a".repeat(32);
  await pg.exec(`
    CREATE TABLE "user" (id text PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL, email_verified boolean DEFAULT false NOT NULL, image text, role text DEFAULT 'user' NOT NULL, suspended boolean DEFAULT false NOT NULL, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL);
    CREATE TABLE user_credit (user_id text PRIMARY KEY REFERENCES "user"(id), token_balance integer NOT NULL DEFAULT 0, lifetime_tokens_used integer NOT NULL DEFAULT 0, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL);
    CREATE TABLE credit_transaction (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES "user"(id), amount integer NOT NULL, type text NOT NULL, description text, tokens_used integer, created_at timestamp DEFAULT now() NOT NULL);
    CREATE TABLE platform_config (key text PRIMARY KEY, value text NOT NULL, updated_at timestamp DEFAULT now() NOT NULL);
    CREATE TABLE generation_job (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES "user"(id), status text NOT NULL DEFAULT 'pending', mode text NOT NULL DEFAULT 'quick', exam_type_id text NOT NULL, section_type_id text NOT NULL, question_count integer NOT NULL, progress integer NOT NULL DEFAULT 0, progress_message text, logs jsonb, result_json jsonb, input_json jsonb, error_message text, tokens_used integer, generation_key_source text, duration_ms integer, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL, completed_at timestamp);
  `);
  generation = await import("../lib/platform-generation");
});
afterAll(() => pg.close());

describe("platform generation admission", () => {
  it("reserves credits before the job can be queued, rejects another active job, and settles once", async () => {
    const userId = await createUser();
    const job = await generation.createGenerationJob(userId, input);
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, userId));
    expect(credit!.tokenBalance).toBe(22000);
    expect(JSON.stringify(job.inputJson)).not.toContain("secret-test");
    await expect(generation.createGenerationJob(userId, input)).rejects.toThrow("Generation already in progress");
    await db.update(schema.generationJob).set({ status: "completed", completedAt: new Date() }).where(eq(schema.generationJob.id, job.id));
    await Promise.all([generation.settleGenerationCredit(job.id, 3000), generation.settleGenerationCredit(job.id, 3000)]);
    const [settled] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, userId));
    expect(settled!.tokenBalance).toBe(47000);
    expect(settled!.lifetimeTokensUsed).toBe(3000);
  });
  it("rejects an unaffordable task without creating a job or changing the balance", async () => {
    const userId = await createUser(100);
    await expect(generation.createGenerationJob(userId, input)).rejects.toThrow("Insufficient AI allowance");
    expect(await db.select().from(schema.generationJob).where(eq(schema.generationJob.userId, userId))).toHaveLength(0);
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, userId));
    expect(credit!.tokenBalance).toBe(100);
  });
  it("allows only one of two concurrent submissions", async () => {
    const userId = await createUser();
    const results = await Promise.allSettled([generation.createGenerationJob(userId, input), generation.createGenerationJob(userId, input)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });
  it("refunds a task that never called the provider, then permits a new task", async () => {
    const userId = await createUser();
    const job = await generation.createGenerationJob(userId, input);
    await db.update(schema.generationJob).set({ status: "cancelled", completedAt: new Date() }).where(eq(schema.generationJob.id, job.id));
    // A cancelled task still has a reservation until the worker has stopped.
    await expect(generation.createGenerationJob(userId, input)).rejects.toThrow("Generation already in progress");
    await generation.settleGenerationCredit(job.id, 0);
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, userId));
    expect(credit!.tokenBalance).toBe(50000);
    await expect(generation.createGenerationJob(userId, input)).resolves.toBeDefined();
  });
  it("counts actual consumption toward the daily budget and rechecks failed-job retries", async () => {
    const userId = await createUser(200000);
    await db.insert(schema.creditTransaction).values({ userId, type: "generation_settlement", amount: 0, tokensUsed: 90000 });
    await expect(generation.createGenerationJob(userId, input)).rejects.toThrow("Daily AI allowance reached");
  });
  it("refuses new tasks when the whole platform daily allowance is exhausted", async () => {
    const userId = await createUser();
    const otherId = await createUser();
    await db.insert(schema.creditTransaction).values({ userId: otherId, type: "generation_settlement", amount: 0, tokensUsed: 1000000 });
    await expect(generation.createGenerationJob(userId, input)).rejects.toThrow("Platform AI daily allowance reached");
  });
});
