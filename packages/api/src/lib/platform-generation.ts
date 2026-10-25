import { and, eq, gte, inArray, notInArray, or, sql } from "drizzle-orm";
import { db, creditTransaction, generationJob, user, userCredit } from "@labas/db";
import type { GenerationInput } from "@labas/ai/schemas";
import { encryptApiKey } from "./encryption";
import { throwBadRequest, throwForbidden } from "./errors";
import { generationTokenBudget, PLATFORM_DAILY_LIMIT, PLATFORM_MAX_QUESTIONS, PLATFORM_USER_DAILY_LIMIT } from "./generation-policy";

export type PlatformGenerationInput = GenerationInput & {
  _isPlatformGeneration?: boolean;
  _platformTokenBudget?: number;
};
const terminalStatuses = ["completed", "completed_partial", "failed", "cancelled"];

export async function assertDailyAiBudget(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], userId: string, budget: number) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const [usage] = await tx.select({
    total: sql<number>`coalesce(sum(case when ${creditTransaction.type} = 'generation_reserve' and not exists (select 1 from credit_transaction settled where settled.type = 'generation_settlement' and settled.description = ${creditTransaction.description}) then -${creditTransaction.amount} when ${creditTransaction.type} = 'generation_settlement' then ${creditTransaction.tokensUsed} else 0 end), 0)`,
    personal: sql<number>`coalesce(sum(case when ${creditTransaction.userId} = ${userId} then case when ${creditTransaction.type} = 'generation_reserve' and not exists (select 1 from credit_transaction settled where settled.type = 'generation_settlement' and settled.description = ${creditTransaction.description}) then -${creditTransaction.amount} when ${creditTransaction.type} = 'generation_settlement' then ${creditTransaction.tokensUsed} else 0 end else 0 end), 0)`,
  }).from(creditTransaction).where(and(
    inArray(creditTransaction.type, ["generation_reserve", "generation_settlement"]),
    or(gte(creditTransaction.createdAt, since), sql`${creditTransaction.type} = 'generation_reserve' and not exists (select 1 from credit_transaction settled where settled.type = 'generation_settlement' and settled.description = ${creditTransaction.description})`),
  ));
  if (Number(usage?.personal ?? 0) + budget > PLATFORM_USER_DAILY_LIMIT) throwBadRequest("Daily AI allowance reached. Try again tomorrow");
  if (Number(usage?.total ?? 0) + budget > PLATFORM_DAILY_LIMIT) throwBadRequest("Platform AI daily allowance reached. Try again tomorrow");
}

export async function createGenerationJob(userId: string, input: PlatformGenerationInput) {
  return db.transaction(async (tx) => {
    // One short admission lock protects both account and platform daily budgets.
    await tx.execute(sql`select pg_advisory_xact_lock(770012)`);
    const [owner] = await tx.select().from(user).where(eq(user.id, userId));
    if (!owner || owner.suspended) throwForbidden("Account is suspended");
    const unsettled = await tx.select({ id: creditTransaction.id }).from(creditTransaction).where(and(
      eq(creditTransaction.userId, userId), eq(creditTransaction.type, "generation_reserve"),
      sql`not exists (select 1 from credit_transaction settled where settled.user_id = ${userId} and settled.type = 'generation_settlement' and settled.description = ${creditTransaction.description})`,
    ));
    const active = await tx.select({ id: generationJob.id }).from(generationJob).where(and(
      eq(generationJob.userId, userId), notInArray(generationJob.status, terminalStatuses),
    ));
    if (input._isPlatformGeneration ? active.length > 0 || unsettled.length > 0 : active.length >= 3) {
      throwBadRequest("Generation already in progress");
    }
    const budget = input._isPlatformGeneration ? generationTokenBudget(input) : 0;
    if (budget) {
      if (input.questionCount > PLATFORM_MAX_QUESTIONS) throwBadRequest("Platform AI supports at most 20 questions per task");
      // Settled jobs use recorded consumption; unfinished reservations retain their
      // full upper limit, including cancelled jobs still stopping upstream work.
      await assertDailyAiBudget(tx, userId, budget);
      const [updated] = await tx.update(userCredit).set({ tokenBalance: sql`${userCredit.tokenBalance} - ${budget}` }).where(and(
        eq(userCredit.userId, userId), gte(userCredit.tokenBalance, budget),
      )).returning();
      if (!updated) throwBadRequest("Insufficient AI allowance. Reduce the question count or contact support");
    }
    const resolved = { ...input, ...(budget ? { _platformTokenBudget: budget } : {}) };
    const encryptedInput = { ...resolved, apiKeyConfig: { ...resolved.apiKeyConfig, apiKey: encryptApiKey(resolved.apiKeyConfig.apiKey) } };
    const [job] = await tx.insert(generationJob).values({
      userId, mode: input.mode, examTypeId: input.examType, sectionTypeId: input.section,
      questionCount: input.questionCount, status: "pending", progress: 0,
      generationKeySource: budget ? "free_credit" : "byok", inputJson: encryptedInput,
    }).returning();
    if (!job) throwBadRequest("Failed to create generation job");
    if (budget) await tx.insert(creditTransaction).values({ userId, amount: -budget, type: "generation_reserve", description: `generation:${job.id}` });
    return job;
  });
}

/** Lock the job so completion, cancellation, and delivery retries settle once. */
export async function settleGenerationCredit(jobId: string, tokensUsed: number) {
  if (!Number.isSafeInteger(tokensUsed) || tokensUsed < 0) throwBadRequest("Invalid AI usage");
  await db.transaction(async (tx) => {
    const [job] = await tx.select().from(generationJob).where(eq(generationJob.id, jobId)).for("update");
    if (!job || job.generationKeySource !== "free_credit" || !terminalStatuses.includes(job.status)) return;
    const description = `generation:${jobId}`;
    const entries = await tx.select().from(creditTransaction).where(and(eq(creditTransaction.userId, job.userId), eq(creditTransaction.description, description)));
    if (entries.some((entry) => entry.type === "generation_settlement")) return;
    const reservation = entries.find((entry) => entry.type === "generation_reserve");
    if (!reservation) return; // Historical jobs have no reservation to refund.
    const reserved = -reservation.amount;
    const charged = Math.min(reserved, tokensUsed);
    await tx.update(userCredit).set({
      tokenBalance: sql`${userCredit.tokenBalance} + ${reserved - charged}`,
      lifetimeTokensUsed: sql`${userCredit.lifetimeTokensUsed} + ${tokensUsed}`,
    }).where(eq(userCredit.userId, job.userId));
    await tx.insert(creditTransaction).values({ userId: job.userId, amount: reserved - charged, type: "generation_settlement", description, tokensUsed });
    await tx.update(generationJob).set({ tokensUsed }).where(eq(generationJob.id, jobId));
  });
}
