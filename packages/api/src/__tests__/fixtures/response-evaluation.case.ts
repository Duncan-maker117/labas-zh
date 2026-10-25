import { afterAll, beforeAll, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { join } from "node:path";
import * as schema from "../../../../db/src/schema";

const pg = new PGlite();
const db = drizzle(pg, { schema });
mock.module("@labas/db", () => ({ ...schema, db }));
mock.module("@labas/env/server", () => ({ env: { FREE_CREDITS_ENABLED: true, PLATFORM_AI_API_KEY: "test-only-key", API_KEY_ENCRYPTION_KEY: "a".repeat(32) } }));
const { attemptRouter } = await import("../../routers/attempt");
const { evaluateSavedResponse, listResponseEvaluations } = await import("../../lib/response-evaluation");
const caller = (id: string) => attemptRouter.createCaller({ session: { user: { id } } as never, auth: null, ip: "127.0.0.1" });
let calls = 0;
let fail = false;
let hold: Promise<void> | undefined;
const fetchOriginal = globalThis.fetch;
globalThis.fetch = (async () => {
  calls++; await hold;
  if (fail) return new Response(JSON.stringify({ error: { message: "simulated provider failure" } }), { status: 400 });
  const content = JSON.stringify({ criteria: { task: 80, organization: 60, vocabulary: 70, grammar: 50 }, feedback: "观点清楚，请补充例子。", improvements: ["检查时态。"] });
  return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: "stop" }] })}\n\ndata: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 300, completion_tokens: 200, total_tokens: 500 } })}\n\ndata: [DONE]\n\n`, { headers: { "Content-Type": "text/event-stream" } });
}) as typeof fetch;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: join(import.meta.dir, "../../../../db/src/migrations") });
  await db.insert(schema.examType).values({ id: "TOEFL", name: "TOEFL", language: "English" });
  await db.insert(schema.platformConfig).values([{ key: "platform_ai_base_url", value: "https://assessment.invalid/v1" }, { key: "platform_ai_model", value: "test-model" }]);
}, 30000);
afterAll(async () => { globalThis.fetch = fetchOriginal; await pg.close(); });
let sequence = 0;
async function fixture(format = "essay", section = "WRITING", balance = 50000) {
  const userId = `assessment-user-${++sequence}`;
  await db.insert(schema.user).values({ id: userId, name: userId, email: `${userId}@example.test` });
  await db.insert(schema.userCredit).values({ userId, tokenBalance: balance });
  const [pkg] = await db.insert(schema.testPackage).values({ title: "Isolated practice", examTypeId: "TOEFL", creatorUserId: userId }).returning();
  const [sec] = await db.insert(schema.packageSection).values({ packageId: pkg!.id, sectionTypeId: section, title: section }).returning();
  const [q] = await db.insert(schema.question).values({ examTypeId: "TOEFL", sectionTypeId: section, format, passageText: "A practice task or listening script.", questionText: "Describe a useful experience.", correctAnswer: "An example response.", creatorUserId: userId }).returning();
  await db.insert(schema.sectionQuestion).values({ sectionId: sec!.id, questionId: q!.id });
  const [attempt] = await db.insert(schema.testAttempt).values({ userId, packageId: pkg!.id, startedAt: new Date(Date.now() - 10000) }).returning();
  const [sr] = await db.insert(schema.sectionResult).values({ attemptId: attempt!.id, sectionTypeId: section }).returning();
  return { userId, attempt: attempt!, q: q!, sr: sr!, caller: caller(userId) };
}
async function submitAndFinish(f: Awaited<ReturnType<typeof fixture>>, text = "My original answer with an example.") {
  await f.caller.submitAnswer({ attemptId: f.attempt.id, sectionResultId: f.sr.id, questionId: f.q.id, userAnswer: text });
  const result = await f.caller.finish({ attemptId: f.attempt.id });
  const [saved] = await db.select().from(schema.answer).where(eq(schema.answer.sectionResultId, f.sr.id));
  return { result, saved: saved! };
}

it("migration adds all four subjects without requiring seed", async () => {
  const sections = await db.select().from(schema.sectionType);
  expect(sections.map((s) => s.id).sort()).toEqual(["LISTENING", "READING", "SPEAKING", "WRITING"]);
});
it("saves essays pending review, assesses with the real provider client, and reuses the result without another charge", async () => {
  const f = await fixture(); const { result, saved } = await submitAndFinish(f);
  expect(result).toMatchObject({ status: "awaiting_review", maxScore: 100 });
  expect(saved.isCorrect).toBeNull(); expect(saved.partialScore).toBeNull();
  const before = calls;
  await evaluateSavedResponse(f.userId, { answerId: saved.id });
  await evaluateSavedResponse(f.userId, { answerId: saved.id });
  expect(calls - before).toBe(1);
  const review = await f.caller.getById({ id: f.attempt.id });
  expect(review).toMatchObject({ status: "completed", totalScore: 65, maxScore: 100 });
  expect(review!.sections[0]!.answers[0]).toMatchObject({ userAnswer: "My original answer with an example.", isCorrect: null, partialScore: 65 });
  const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, f.userId));
  expect(credit!.tokenBalance).toBe(49500);
  expect((await listResponseEvaluations(f.userId, f.attempt.id))[0]!.feedback).toMatchObject({ score: 65, basis: "text" });
});
it("preserves speaking transcripts and refunds failed assessments before retry", async () => {
  const f = await fixture("spoken_response", "SPEAKING"); const { saved } = await submitAndFinish(f);
  fail = true;
  await expect(evaluateSavedResponse(f.userId, { answerId: saved.id })).rejects.toThrow();
  fail = false;
  expect((await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, f.userId)))[0]!.tokenBalance).toBe(50000);
  expect((await listResponseEvaluations(f.userId, f.attempt.id))[0]!.status).toBe("failed");
  await evaluateSavedResponse(f.userId, { answerId: saved.id });
  expect((await f.caller.getById({ id: f.attempt.id }))!.totalScore).toBe(65);
});
it("rejects foreign answers, mismatched sections, duplicate concurrent assessment and insufficient allowance", async () => {
  const f = await fixture(); const other = await fixture();
  await expect(f.caller.submitAnswer({ attemptId: f.attempt.id, sectionResultId: other.sr.id, questionId: other.q.id, userAnswer: "Injected" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  const { saved } = await submitAndFinish(other);
  await expect(evaluateSavedResponse(f.userId, { answerId: saved.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(listResponseEvaluations(f.userId, other.attempt.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
  let release!: () => void; hold = new Promise((resolve) => { release = resolve; });
  const first = evaluateSavedResponse(other.userId, { answerId: saved.id });
  while (!(await listResponseEvaluations(other.userId, other.attempt.id)).length) await Bun.sleep(10);
  await expect(evaluateSavedResponse(other.userId, { answerId: saved.id })).rejects.toThrow("already running");
  release(); await first; hold = undefined;
  const low = await fixture("essay", "WRITING", 100); const lowSaved = await submitAndFinish(low);
  await expect(evaluateSavedResponse(low.userId, { answerId: lowSaved.saved.id })).rejects.toThrow("Insufficient");
  expect(await listResponseEvaluations(low.userId, low.attempt.id)).toHaveLength(0);
});
it("keeps listening objective grading and blank essays out of pending review", async () => {
  const f = await fixture("multiple_choice", "LISTENING");
  const { saved } = await submitAndFinish(f, f.q.correctAnswer);
  expect(saved.isCorrect).toBe(true);
  expect((await f.caller.getById({ id: f.attempt.id }))!.totalScore).toBe(1);
  const empty = await fixture(); await submitAndFinish(empty, " ");
  expect((await empty.caller.getById({ id: empty.attempt.id }))!.status).toBe("completed");
});
it("recovers an interrupted reservation and supports personal AI without charging platform allowance", async () => {
  const f = await fixture(); const { saved } = await submitAndFinish(f);
  await db.insert(schema.responseEvaluation).values({ answerId: saved.id, status: "running", claimId: "interrupted", updatedAt: new Date(Date.now() - 16 * 60 * 1000) });
  await db.update(schema.userCredit).set({ tokenBalance: 38000 }).where(eq(schema.userCredit.userId, f.userId));
  await db.insert(schema.creditTransaction).values({ userId: f.userId, amount: -12000, type: "generation_reserve", description: "assessment:interrupted" });
  await evaluateSavedResponse(f.userId, { answerId: saved.id });
  expect((await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, f.userId)))[0]!.tokenBalance).toBe(49500);
  const own = await fixture(); const ownSaved = await submitAndFinish(own);
  await evaluateSavedResponse(own.userId, { answerId: ownSaved.saved.id, apiKeyConfig: { baseUrl: "https://assessment.invalid/v1", apiKey: "personal-test-key", model: "test", maxTokens: 4096 } });
  expect((await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, own.userId)))[0]!.tokenBalance).toBe(50000);
});
