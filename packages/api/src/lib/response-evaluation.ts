import { assertDailyAiBudget } from "./platform-generation";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, answer, sectionResult, testAttempt, question, responseEvaluation, packageSection, sectionQuestion, userCredit, creditTransaction } from "@labas/db";
import { assessResponse } from "@labas/ai/assessment";
import { getTokenBudgetUsage, withTokenBudget } from "@labas/ai/token-budget";
import { isSubjectiveFormat } from "@labas/ai/practice-policy";
import { aiKeyConfigSchema, examTypeSchema, sectionTypeSchema, questionFormatSchema } from "@labas/ai/schemas";
import { resolveGenerationInput } from "./generation-config";
import { throwBadRequest, throwForbidden, throwNotFound } from "./errors";
import { isUserSuspended, ensureUserCreditRow } from "./credit";
import type { z } from "zod";

const STALE_ASSESSMENT_MS = 15 * 60 * 1000;

async function releaseStaleAssessment(answerId: string, userId: string) {
  await db.transaction(async (tx) => {
    const [record] = await tx.select().from(responseEvaluation).where(eq(responseEvaluation.answerId, answerId)).for("update");
    if (!record || record.status !== "running" || Date.now() - record.updatedAt.getTime() < STALE_ASSESSMENT_MS) return;
    const description = `assessment:${record.claimId}`;
    const entries = await tx.select().from(creditTransaction).where(and(eq(creditTransaction.userId, userId), eq(creditTransaction.description, description)));
    const reserve = entries.find((entry) => entry.type === "generation_reserve");
    if (reserve && !entries.some((entry) => entry.type === "generation_settlement")) {
      await tx.update(userCredit).set({ tokenBalance: sql`${userCredit.tokenBalance} - ${reserve.amount}` }).where(eq(userCredit.userId, userId));
      await tx.insert(creditTransaction).values({ userId, amount: -reserve.amount, type: "generation_settlement", description, tokensUsed: 0 });
    }
    await tx.update(responseEvaluation).set({ status: "failed", updatedAt: new Date() }).where(eq(responseEvaluation.id, record.id));
  });
}

/** Subjective attempts use 100 points per question, avoiding integer rounding of a single essay to 0/1. */
export async function recalculateSubjectiveAttempt(database: Pick<typeof db, "select" | "update">, attemptId: string) {
  const [attempt] = await database.select().from(testAttempt).where(eq(testAttempt.id, attemptId));
  if (!attempt?.packageId) throwNotFound("Attempt");
  const sections = await database.select().from(sectionResult).where(eq(sectionResult.attemptId, attemptId)).orderBy(sectionResult.createdAt);
  const packageSections = await database.select().from(packageSection).where(eq(packageSection.packageId, attempt.packageId)).orderBy(packageSection.orderIndex);
  let totalScore = 0, maxScore = 0, pending = 0;
  for (const [index, section] of sections.entries()) {
    const sourceSection = packageSections[index];
    if (!sourceSection) continue;
    const questions = await database.select({ id: sectionQuestion.questionId }).from(sectionQuestion).where(eq(sectionQuestion.sectionId, sourceSection.id));
    const responses = await database.select({ text: answer.userAnswer, correct: answer.isCorrect, partial: answer.partialScore, format: question.format }).from(answer).innerJoin(question, eq(answer.questionId, question.id)).where(eq(answer.sectionResultId, section.id));
    let score = 0;
    for (const response of responses) {
      if (isSubjectiveFormat(response.format) && response.text?.trim() && response.partial === null) pending++;
      score += response.correct === true ? 100 : (response.partial ?? 0);
    }
    const maximum = questions.length * 100;
    await database.update(sectionResult).set({ score, maxScore: maximum }).where(eq(sectionResult.id, section.id));
    totalScore += score; maxScore += maximum;
  }
  const status = pending ? "awaiting_review" : "completed";
  await database.update(testAttempt).set({ totalScore, maxScore, status }).where(eq(testAttempt.id, attemptId));
  return { totalScore, maxScore, pending, status, percentage: maxScore ? Math.round(totalScore / maxScore * 100) : 0 };
}

export async function listResponseEvaluations(userId: string, attemptId: string) {
  const [attempt] = await db.select({ userId: testAttempt.userId }).from(testAttempt).where(eq(testAttempt.id, attemptId));
  if (!attempt) throwNotFound("Attempt");
  if (attempt.userId !== userId) throwForbidden();
  return db.select({ answerId: responseEvaluation.answerId, status: responseEvaluation.status, score: responseEvaluation.score, feedback: responseEvaluation.feedback, model: responseEvaluation.model, updatedAt: responseEvaluation.updatedAt }).from(responseEvaluation).innerJoin(answer, eq(responseEvaluation.answerId, answer.id)).innerJoin(sectionResult, eq(answer.sectionResultId, sectionResult.id)).where(eq(sectionResult.attemptId, attemptId));
}

export async function evaluateSavedResponse(userId: string, input: { answerId: string; apiKeyConfig?: z.infer<typeof aiKeyConfigSchema> }) {
  if (await isUserSuspended(userId)) throwForbidden("Account is suspended");
  const [row] = await db.select({ answerId: answer.id, text: answer.userAnswer, attemptId: testAttempt.id, owner: testAttempt.userId, status: testAttempt.status, exam: question.examTypeId, section: question.sectionTypeId, format: question.format, task: question.questionText, reference: question.correctAnswer }).from(answer).innerJoin(sectionResult, eq(answer.sectionResultId, sectionResult.id)).innerJoin(testAttempt, eq(sectionResult.attemptId, testAttempt.id)).innerJoin(question, eq(answer.questionId, question.id)).where(eq(answer.id, input.answerId));
  if (!row) throwNotFound("Answer");
  if (row.owner !== userId) throwForbidden();
  if (!["completed", "awaiting_review"].includes(row.status)) throwBadRequest("Finish the attempt before requesting assessment");
  if (!isSubjectiveFormat(row.format) || !row.text?.trim()) throwBadRequest("A written or transcribed response is required");
  if (row.text.length > 12000) throwBadRequest("Response exceeds 12000 characters");
  const [cached] = await db.select().from(responseEvaluation).where(eq(responseEvaluation.answerId, row.answerId));
  if (cached?.status === "completed") return cached;
  if (cached?.status === "running") await releaseStaleAssessment(row.answerId, userId);
  const resolved = await resolveGenerationInput({ examType: examTypeSchema.parse(row.exam), section: sectionTypeSchema.parse(row.section), formats: [questionFormatSchema.parse(row.format)], difficulty: 3, topics: ["response assessment"], questionCount: 1, mode: "quick", apiKeyConfig: input.apiKeyConfig }, userId);
  const claimId = crypto.randomUUID();
  const budget = resolved._isPlatformGeneration ? 12000 : 0;
  if (budget) await ensureUserCreditRow(userId);
  const claimed = await db.transaction(async (tx) => {
    if (budget) {
      await tx.execute(sql`select pg_advisory_xact_lock(770012)`);
      await assertDailyAiBudget(tx, userId, budget);
    }
    const [record] = await tx.insert(responseEvaluation).values({ answerId: row.answerId, status: "running", claimId }).onConflictDoUpdate({ target: responseEvaluation.answerId, set: { status: "running", claimId, updatedAt: new Date() }, setWhere: eq(responseEvaluation.status, "failed") }).returning();
    if (!record) throwBadRequest("Assessment is already running; please refresh later");
    if (budget) {
      const charged = await tx.update(userCredit).set({ tokenBalance: sql`${userCredit.tokenBalance} - ${budget}` }).where(and(eq(userCredit.userId, userId), gte(userCredit.tokenBalance, budget))).returning();
      if (!charged.length) throwBadRequest("Insufficient credits for assessment");
      await tx.insert(creditTransaction).values({ userId, amount: -budget, type: "generation_reserve", description: `assessment:${claimId}` });
    }
    return record;
  });
  let result: Awaited<ReturnType<typeof assessResponse>> | undefined;
  try {
    result = await withTokenBudget(budget || undefined, async () => { const assessed = await assessResponse({ ...resolved.apiKeyConfig, maxTokens: 1800 }, { exam: row.exam, format: row.format, task: row.task, reference: row.reference, response: row.text! }); return { ...assessed, tokensUsed: getTokenBudgetUsage() ?? assessed.tokensUsed }; });
  } finally {
    await db.transaction(async (tx) => {
      const [locked] = await tx.select().from(responseEvaluation).where(eq(responseEvaluation.id, claimed.id)).for("update");
      if (locked?.claimId !== claimId || locked.status !== "running") return;
      const charged = Math.min(budget, result?.tokensUsed ?? 0);
      if (budget) {
        await tx.update(userCredit).set({ tokenBalance: sql`${userCredit.tokenBalance} + ${budget - charged}`, lifetimeTokensUsed: sql`${userCredit.lifetimeTokensUsed} + ${charged}` }).where(eq(userCredit.userId, userId));
        await tx.insert(creditTransaction).values({ userId, amount: budget - charged, type: "generation_settlement", description: `assessment:${claimId}`, tokensUsed: charged });
      }
      await tx.update(responseEvaluation).set({ status: result ? "completed" : "failed", score: result?.assessment.score, feedback: result?.assessment, model: result?.model, tokensUsed: result?.tokensUsed, updatedAt: new Date() }).where(eq(responseEvaluation.id, claimed.id));
      if (result) {
        await tx.select({ id: testAttempt.id }).from(testAttempt).where(eq(testAttempt.id, row.attemptId)).for("update");
        await tx.update(answer).set({ partialScore: result.assessment.score, isCorrect: null }).where(eq(answer.id, row.answerId));
        await recalculateSubjectiveAttempt(tx, row.attemptId);
      }
    });
  }
  return { ...claimed, status: "completed", score: result!.assessment.score, feedback: result!.assessment };
}
