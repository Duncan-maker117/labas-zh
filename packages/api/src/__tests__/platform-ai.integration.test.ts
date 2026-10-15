import { afterAll, beforeAll, describe, expect, it, mock, spyOn } from "bun:test";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../../../db/src/schema";
import { closeTestPGlite, createTestUserData, getTestPGlite } from "./test-setup";
import type { GenerationInput } from "@labas/ai/schemas";
import type { Context } from "../context";

type Queued = { input: GenerationInput; jobId: string };
type TestJob = { data: Queued; updateProgress: (progress: number) => Promise<void> };
const queued = new Map<string, Queued>();
const processors = new Map<string, (job: TestJob) => Promise<void>>();
let failDelivery = false;
class TestQueue {
  async add(_name: string, data: Queued) {
    if (failDelivery) throw new Error("Test transport unavailable");
    queued.set(data.jobId, data);
  }
  async getJob(id: string) { return queued.has(id) ? { remove: async () => { queued.delete(id); } } : null; }
}
class TestWorker {
  constructor(name: string, process: (job: TestJob) => Promise<void>) { processors.set(name, process); }
}
mock.module("bullmq", () => ({ Queue: TestQueue, Worker: TestWorker }));
mock.module("ioredis", () => ({ default: class {} }));
mock.module("@labas/env/server", () => ({ env: {
  FREE_CREDITS_ENABLED: true, FREE_CREDITS_MAX_POOL: 1000000, DEFAULT_SIGNUP_CREDIT_TOKENS: 50000,
  PLATFORM_AI_API_KEY: "platform-only-test-secret", PLATFORM_AI_BASE_URL: "https://example.invalid/v1", PLATFORM_AI_MODEL: "test-model",
  REDIS_URL: "redis://example.invalid:6379", API_KEY_ENCRYPTION_KEY: "a".repeat(32),
} }));
let db: ReturnType<typeof drizzle<typeof schema>>;
let ai: typeof import("../routers/ai")["aiRouter"];
let queue: typeof import("../queue");
let sequence = 0;
async function customer() {
  const id = `customer-${++sequence}`;
  await db.insert(schema.user).values({ id, name: id, email: `${id}@test.invalid` });
  const session = { user: { id }, expiresAt: new Date() } as NonNullable<Context["session"]>;
  return { id, caller: ai.createCaller({ session, auth: null } as Context) };
}
const input = { examType: "IELTS" as const, section: "READING" as const, formats: ["multiple_choice" as const], difficulty: 3, topics: ["Science"], questionCount: 1, mode: "quick" as const };
beforeAll(async () => {
  process.env.API_KEY_ENCRYPTION_KEY = "a".repeat(32);
  await createTestUserData();
  db = drizzle(await getTestPGlite(), { schema });
  mock.module("@labas/db", () => ({ db, ...schema }));
  ai = (await import("../routers/ai")).aiRouter;
  queue = await import("../queue");
});
afterAll(closeTestPGlite);

describe("customer AI without API keys", () => {
  it("generates, saves, settles real reported usage, and never returns the platform key", async () => {
    const { id, caller } = await customer();
    const { jobId } = await caller.generate(input);
    expect(JSON.stringify(queued.get(jobId))).not.toContain("platform-only-test-secret");
    const question = {
      format: "multiple_choice", passageText: "Plants capture sunlight and use it to make food. This process is called photosynthesis and releases oxygen into the atmosphere.",
      questionText: "What process helps plants make their own food?", options: [{ key: "A", text: "Photosynthesis" }, { key: "B", text: "Evaporation" }, { key: "C", text: "Condensation" }, { key: "D", text: "Erosion" }],
      correctAnswer: "A", explanation: "The passage identifies photosynthesis as the process plants use to make food.", difficulty: 3, skillTags: ["detail"],
    };
    const transport = spyOn(globalThis, "fetch").mockImplementation(async () => new Response(
      `data: ${JSON.stringify({ choices: [{ delta: { content: JSON.stringify({ questions: [question] }) } }], usage: { total_tokens: 1234 } })}\n\ndata: [DONE]\n\n`,
      { headers: { "content-type": "text/event-stream" } },
    ));
    try {
      const data = queued.get(jobId)!;
      await Promise.all([
        processors.get("generation-fast")!({ data: structuredClone(data), updateProgress: async () => {} }),
        processors.get("generation-fast")!({ data: structuredClone(data), updateProgress: async () => {} }),
      ]);
      expect(transport).toHaveBeenCalledTimes(1);
    }
    finally { transport.mockRestore(); }
    const status = await caller.getJobStatus({ jobId });
    expect(status?.status).toBe("completed");
    expect(status?.tokensUsed).toBe(1234);
    expect(JSON.stringify(status)).not.toContain("platform-only-test-secret");
    expect(status).not.toHaveProperty("inputJson");
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, id));
    expect(credit!.tokenBalance).toBe(48766);
    expect(await db.select().from(schema.question).where(eq(schema.question.creatorUserId, id))).toHaveLength(1);
  });
  it("refunds queued cancellations and rechecks allowance when retrying", async () => {
    const { id, caller } = await customer();
    const { jobId } = await caller.generate(input);
    expect(await caller.cancelJob({ jobId })).toEqual({ ok: true });
    expect(queued.has(jobId)).toBe(false);
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, id));
    expect(credit!.tokenBalance).toBe(50000);
    await db.update(schema.userCredit).set({ tokenBalance: 1 }).where(eq(schema.userCredit.userId, id));
    await expect(caller.retryJob({ jobId })).rejects.toThrow("Insufficient AI allowance");
  });
  it("returns the reservation when delivery fails, and refuses suspended users", async () => {
    const { id, caller } = await customer();
    failDelivery = true;
    try { await expect(caller.generate(input)).rejects.toThrow("Test transport unavailable"); }
    finally { failDelivery = false; }
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, id));
    expect(credit!.tokenBalance).toBe(50000);
    await db.update(schema.user).set({ suspended: true }).where(eq(schema.user.id, id));
    await expect(caller.generate(input)).rejects.toThrow("Account is suspended");
  });
  it("does not charge credits when the provider rejects the request", async () => {
    const { id, caller } = await customer();
    const { jobId } = await caller.generate(input);
    const transport = spyOn(globalThis, "fetch").mockImplementation(async () => new Response("Unavailable", { status: 503 }));
    try { await processors.get("generation-fast")!({ data: queued.get(jobId)!, updateProgress: async () => {} }); }
    finally { transport.mockRestore(); }
    const status = await caller.getJobStatus({ jobId });
    expect(status?.status).toBe("failed");
    expect(status?.tokensUsed).toBe(0);
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, id));
    expect(credit!.tokenBalance).toBe(50000);
  });
  it("lets administrators cancel through the same refund path", async () => {
    const { id, caller } = await customer();
    const { jobId } = await caller.generate(input);
    const { adminRouter } = await import("../routers/admin");
    const session = { user: { id: "user-1" }, expiresAt: new Date() } as NonNullable<Context["session"]>;
    const admin = adminRouter.createCaller({ session, auth: null } as Context);
    await admin.cancelAnyJob({ jobId });
    const [credit] = await db.select().from(schema.userCredit).where(eq(schema.userCredit.userId, id));
    expect(credit!.tokenBalance).toBe(50000);
    const state = await caller.getJobStatus({ jobId });
    expect(state?.status).toBe("cancelled");
    const allowance = await admin.getMyCredit();
    expect(allowance.platformAiReady).toBe(true);
    expect(JSON.stringify(allowance)).not.toContain("platform-only-test-secret");
  });
  it("rechecks platform availability on retries after the service has been disabled", async () => {
    const { caller } = await customer();
    const { jobId } = await caller.generate(input);
    await caller.cancelJob({ jobId });
    await db.insert(schema.platformConfig).values({ key: "free_credits_enabled", value: "false" });
    await expect(caller.retryJob({ jobId })).rejects.toThrow("Platform AI is currently unavailable");
    await expect(caller.generate(input)).rejects.toThrow("Platform AI is currently unavailable");
  });
});
