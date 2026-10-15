export const PLATFORM_USER_DAILY_LIMIT = 100_000;
export const PLATFORM_DAILY_LIMIT = 1_000_000;
export const PLATFORM_MAX_QUESTIONS = 20;

/** Shared admission estimate; the provider budget applies to the whole task. */
export function generationTokenBudget(input: { mode: "quick" | "agentic"; questionCount: number }) {
  return input.mode === "agentic" ? 12000 + input.questionCount * 6000 : 8000 + input.questionCount * 4000;
}
