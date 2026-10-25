import { EXAM_CATALOG, getExamProfile, getExamSections, getExamFormats } from "@labas/ai/exam-catalog";
import { formatsForSection } from "@labas/ai/practice-policy";
import type { GenerationInput } from "@labas/ai/schemas";
import { env } from "@labas/env/server";
import { getConfig, getPlatformAiConfig, getUserCredit, autoRefillIfEligible } from "./credit";
import { decryptApiKey } from "./encryption";
import { throwBadRequest } from "./errors";
import type { PlatformGenerationInput } from "./platform-generation";

/** Resolve credentials on the server for both new jobs and user-initiated retries. */
export async function resolveGenerationInput(input: Omit<GenerationInput, "apiKeyConfig"> & { apiKeyConfig?: GenerationInput["apiKeyConfig"] }, userId: string, options?: { validateExam?: boolean }): Promise<PlatformGenerationInput> {
  const sections = input.selectedSections ?? [input.section];
  const spec = EXAM_CATALOG[input.examType];
  if (options?.validateExam !== false && spec) {
    if (!input.examProfile) {
      // Legacy jobs did not store a profile. Infer a compatible paper without rewriting them.
      const compatible = spec.profiles.find((profile) => sections.every((section) => profile.sections.some((item) => item.id === section)) && input.formats.every((format) => sections.some((section) => getExamFormats(input.examType, section, profile.id).includes(format))));
      if (compatible) input = { ...input, examProfile: compatible.id };
    }
    const profile = getExamProfile(input.examType, input.examProfile);
    if (input.examProfile && profile?.id !== input.examProfile) throwBadRequest("Unknown exam profile");
    const allowedSections = getExamSections(input.examType, input.examProfile);
    if (sections.some((section) => !allowedSections.some((allowed) => allowed.id === section))) throwBadRequest("Section is not part of this exam profile");
    if (input.formats.some((format) => !sections.some((section) => getExamFormats(input.examType, section, input.examProfile).includes(format)))) throwBadRequest("Question format is not part of this exam profile");
  }
  if (input.questionCount < sections.length) throwBadRequest("Question count must cover every selected section");
  for (const section of sections) {
    if (!formatsForSection(section, input.formats, options?.validateExam === false ? undefined : input.examType, input.examProfile).length) throwBadRequest("Choose a compatible question format for every selected section");
  }
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
