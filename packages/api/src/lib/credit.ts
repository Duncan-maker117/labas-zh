import { eq, sql, and, desc, sum, gte, notInArray } from "drizzle-orm";
import { db } from "@labas/db";
import { userCredit, creditTransaction, user, platformConfig } from "@labas/db";
import { TRPCError } from "@trpc/server";
import { env } from "@labas/env/server";

const COOLDOWN_DAYS = 7;

export async function getConfigRaw(key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: platformConfig.value })
    .from(platformConfig)
    .where(eq(platformConfig.key, key))
    .limit(1);
  return row?.value ?? null;
}

export async function getConfig(key: string, envFallback: () => string): Promise<string> {
  const dbVal = await getConfigRaw(key);
  return dbVal ?? envFallback();
}

export async function setConfig(key: string, value: string): Promise<void> {
  await db
    .insert(platformConfig)
    .values({ key, value })
    .onConflictDoUpdate({
      target: [platformConfig.key],
      set: { value },
    });
}

async function isFreeCreditsEnabled(): Promise<boolean> {
  const val = await getConfig("free_credits_enabled", () => String(env.FREE_CREDITS_ENABLED));
  return val === "true";
}

async function getFreeCreditsMaxPool(): Promise<number> {
  const val = await getConfig("free_credits_max_pool", () => String(env.FREE_CREDITS_MAX_POOL));
  return parseInt(val, 10) || env.FREE_CREDITS_MAX_POOL;
}

export async function getUserCredit(userId: string) {
  const [credit] = await db
    .select()
    .from(userCredit)
    .where(eq(userCredit.userId, userId))
    .limit(1);

  return credit ?? { userId, tokenBalance: 0, lifetimeTokensUsed: 0 };
}

export async function ensureUserCreditRow(userId: string) {
  await db
    .insert(userCredit)
    .values({ userId, tokenBalance: 0 })
    .onConflictDoNothing();
}

export async function deductCredit(
  userId: string,
  tokens: number,
): Promise<{ newBalance: number }> {
  if (!Number.isSafeInteger(tokens) || tokens <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid credit amount" });
  }
  await ensureUserCreditRow(userId);
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(userCredit)
      .set({
        tokenBalance: sql`token_balance - ${tokens}`,
        lifetimeTokensUsed: sql`lifetime_tokens_used + ${tokens}`,
      })
      .where(and(eq(userCredit.userId, userId), gte(userCredit.tokenBalance, tokens)))
      .returning();

    if (!updated) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient credits" });
    }

    await tx.insert(creditTransaction).values({
      userId,
      amount: -tokens,
      type: "generation_spend",
      tokensUsed: tokens,
    });

    return { newBalance: updated.tokenBalance };
  });
}

export async function isUserSuspended(userId: string): Promise<boolean> {
  const [u] = await db
    .select({ suspended: user.suspended })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return u?.suspended ?? false;
}

export async function grantSignupCredit(
  userId: string,
  amount: number,
): Promise<void> {
  await ensureUserCreditRow(userId);

  await db
    .update(userCredit)
    .set({
      tokenBalance: sql`token_balance + ${amount}`,
    })
    .where(eq(userCredit.userId, userId));

  await db.insert(creditTransaction).values({
    userId,
    amount,
    type: "signup_bonus",
    description: "Welcome credits",
  });
}

export async function getPoolUsage() {
  const maxPool = await getFreeCreditsMaxPool();
  const [agg] = await db
    .select({ totalDistributed: sum(creditTransaction.amount) })
    .from(creditTransaction)
    .where(and(gte(creditTransaction.amount, 0), notInArray(creditTransaction.type, ["generation_settlement"])));

  const totalDistributed = Number(agg?.totalDistributed ?? 0);

  return {
    totalDistributed,
    maxPool,
    remaining: Math.max(0, maxPool - totalDistributed),
  };
}

export async function getLastRefillAt(userId: string) {
  const [txn] = await db
    .select({ createdAt: creditTransaction.createdAt })
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.userId, userId),
        gte(creditTransaction.amount, 0),
        notInArray(creditTransaction.type, ["generation_settlement"]),
      ),
    )
    .orderBy(desc(creditTransaction.createdAt))
    .limit(1);

  return txn ?? null;
}

function calcCooldownRemaining(lastRefillAt: Date | string | null): number {
  if (!lastRefillAt) return 0;
  const last = new Date(lastRefillAt).getTime();
  const cooldownEnd = last + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / (24 * 60 * 60 * 1000)));
  return remaining;
}

export async function autoRefillIfEligible(
  userId: string,
): Promise<{ refilled: boolean; message: string; newBalance?: number }> {
  if (!(await isFreeCreditsEnabled())) {
    return { refilled: false, message: "Free credits are currently disabled." };
  }
  const maxPool = await getFreeCreditsMaxPool();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(770011)`);
    const [reservation] = await tx.select({ id: creditTransaction.id }).from(creditTransaction).where(and(
      eq(creditTransaction.userId, userId), eq(creditTransaction.type, "generation_reserve"),
      sql`not exists (select 1 from credit_transaction settled where settled.type = 'generation_settlement' and settled.description = ${creditTransaction.description})`,
    )).limit(1);
    if (reservation) return { refilled: false, message: "Generation already in progress" };
    const [current] = await tx.select().from(userCredit).where(eq(userCredit.userId, userId));
    if (current && current.tokenBalance > 0) return { refilled: false, message: "AI allowance is still available" };
    const [distributed] = await tx.select({ total: sum(creditTransaction.amount) }).from(creditTransaction)
      .where(and(gte(creditTransaction.amount, 0), notInArray(creditTransaction.type, ["generation_settlement"])));
    const amount = Number(env.DEFAULT_SIGNUP_CREDIT_TOKENS);
    if (maxPool - Number(distributed?.total ?? 0) < amount) {
      return { refilled: false, message: "Free credit pool is exhausted. Contact admin." };
    }

    const [lastRefill] = await tx.select({ createdAt: creditTransaction.createdAt }).from(creditTransaction)
      .where(and(eq(creditTransaction.userId, userId), gte(creditTransaction.amount, 0), notInArray(creditTransaction.type, ["generation_settlement"])))
      .orderBy(desc(creditTransaction.createdAt)).limit(1);
    const cooldown = calcCooldownRemaining(lastRefill?.createdAt ?? null);

    if (cooldown > 0) {
      return { refilled: false, message: `Cooldown active. Try again in ${cooldown} day(s).` };
    }

    await tx.insert(userCredit).values({ userId, tokenBalance: 0 }).onConflictDoNothing();

    const [updated] = await tx
      .update(userCredit)
      .set({
        tokenBalance: sql`token_balance + ${amount}`,
      })
      .where(eq(userCredit.userId, userId)).returning();

    await tx.insert(creditTransaction).values({
      userId,
      amount,
      type: "auto_refill",
      description: "Auto-refill from free credit pool",
    });

    return { refilled: true, message: `Refilled ${amount.toLocaleString()} tokens from free pool.`, newBalance: updated!.tokenBalance };
  });
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return "···";
  return key.slice(0, 4) + "···" + key.slice(-4);
}

export async function getPlatformAiConfig(): Promise<{
  baseUrl: string;
  model: string;
  apiKey: string | null;
  provider: string;
}> {
  const [baseUrl, model, apiKey, provider] = await Promise.all([
    getConfig("platform_ai_base_url", () => env.PLATFORM_AI_BASE_URL || "https://api.openai.com/v1"),
    getConfig("platform_ai_model", () => env.PLATFORM_AI_MODEL || "gpt-4o-mini"),
    getConfigRaw("platform_ai_api_key"),
    getConfig("platform_ai_provider", () => "openai"),
  ]);
  return { baseUrl, model, apiKey, provider };
}
