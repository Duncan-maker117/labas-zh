import type { GenerationInput } from "@labas/ai/schemas";
import { env } from "@labas/env/server";
import { getConfig, getPlatformAiConfig, getUserCredit, autoRefillIfEligible } from "./credit";
import { decryptApiKey } from "./encryption";
import { throwBadRequest } from "./errors";
import type { PlatformGenerationInput } from "./platform-generation";

/** Resolve credentials on the server for both new jobs and user-initiated retries. */
export async function resolveGenerationInput(input: Omit<GenerationInput, "apiKeyConfig"> & { apiKeyConfig?: GenerationInput["apiKeyConfig"] }, userId: string): Promise<PlatformGenerationInput> {
  if (input.apiKeyConfig?.apiKey) return input as GenerationInput;
  const enabled = await getConfig("free_credits_enabled", () => String(env.FREE_CREDITS_ENABLED));
  if (enabled !== "true") throwBadRequest("Platform AI is currently unavailable. Contact support");
  const config = await getPlatformAiConfig();
  let apiKey = config.apiKey ?? env.PLATFORM_AI_API_KEY;
  if (!apiKey) throwBadRequest("Platform AI is not configured. Contact support");
  if (config.apiKey) {
    // Accept legacy plaintext configuration; new admin saves are encrypted.
    try { apiKey = decryptApiKey(config.apiKey); } catch { /* legacy value */ }
  }
  const credit = await getUserCredit(userId);
  if (credit.tokenBalance <= 0) await autoRefillIfEligible(userId);
  return { ...input, apiKeyConfig: { baseUrl: config.baseUrl, apiKey, model: config.model, maxTokens: 4096 }, _isPlatformGeneration: true };
}
