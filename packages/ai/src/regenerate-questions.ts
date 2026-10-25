import { examGenerationInstruction } from "./exam-catalog";
import { sectionMaterialInstruction } from "./practice-policy";
import { OpenAICompatibleClient } from "./client";
import { parseAiJsonResponse } from "./parse-response";
import { getGenericQuestionJsonSchemaDescription } from "./repair";
import { OPTION_QUALITY_RULES } from "./prompts";
import { buildContentLanguageRules, buildExplanationLanguageRule } from "./language-rules";
import type { GenerationInput } from "./schemas";

function parseJsonResponse(content: string): unknown {
  return parseAiJsonResponse(content);
}

function calculateRegenerateMaxTokens(userMax: number, count: number): number {
  const base = userMax > 0 ? userMax : 16_384;
  return Math.min(Math.max(base, 2_000 + count * 600), 64_000);
}

const SYSTEM_PROMPT =
  "You are a precise exam question generator. You always return valid JSON. You never include markdown formatting around the JSON.";

/**
 * Regenerate questions that failed structural or semantic validation.
 */
export async function regenerateQuestions(
  client: OpenAICompatibleClient,
  input: GenerationInput,
  passage: string,
  count: number,
  context: string,
  onToken?: (token: string) => void,
): Promise<{ questions: Array<Record<string, unknown>>; tokensUsed: number; reasoning?: string }> {
  const schema = getGenericQuestionJsonSchemaDescription();

  const avoidContext = input.avoidTopics?.length
    ? `\nThe following topics are ALREADY covered by other questions. Generate DIFFERENT questions not overlapping with:\n${input.avoidTopics.map(t => `  - "${t}"`).join("\n")}`
    : "";

  const prompt = `You are an expert exam question writer. ${context}${avoidContext}

DIVERSITY RULES:
- Generate questions covering DIFFERENT parts of the passage than any failed or already-covered topics above.
- Each new question must test a DISTINCT aspect.
- Do NOT generate a variant of the same question — worded differently but testing the same concept.

Passage:
"""
${passage}
"""

Generate ${count} new ${input.section.toLowerCase()} practice questions for ${input.examType} exam.
${sectionMaterialInstruction(input.section)}
${examGenerationInstruction(input.examType, input.section, input.examProfile)}
Formats: ${input.formats.join(", ")}
Difficulty: ${input.difficulty}/5

Rules:
- Reading/listening questions use the material. Writing/speaking questions ask for an original response to the assignment.
- Use "passageText" field with relevant excerpt (or full passage)
${OPTION_QUALITY_RULES}
${buildContentLanguageRules(input.examType)}
${buildExplanationLanguageRule(input.examType)}
- For true_false_not_given: correctAnswer must be TRUE, FALSE, or NOT_GIVEN (uppercase)
- For author_view: correctAnswer must be YES, NO, or NOT_GIVEN (uppercase)
- For matching_pairs: options are {key, text} pairs. correctAnswer is serialized mapping.
- For error_recognition: options are error segments. correctAnswer is key of segment with error.
- For text_insertion: options are position markers. correctAnswer is best position key.

Question schema:
${schema}

Return ONLY valid JSON conforming to this schema.`;

  const result = await client.chatCompletion(
    {
      model: input.apiKeyConfig.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: calculateRegenerateMaxTokens(input.apiKeyConfig.maxTokens, count),
      response_format: { type: "json_object" },
    },
    onToken ? { onToken } : undefined,
  );

  const parsed = parseJsonResponse(result.content) as Record<string, unknown>;
  if (!Array.isArray(parsed.questions)) {
    throw new Error("Missing questions array in regeneration response");
  }
  return {
    questions: parsed.questions as Array<Record<string, unknown>>,
    tokensUsed: result.usage?.total_tokens ?? 0,
    reasoning: result.reasoning,
  };
}

export function buildRegenerationContext(
  invalid: Array<{ index: number; errors: string[] }>,
): string {
  const details = invalid
    .map((item) => `Q${item.index + 1}: ${item.errors.join(", ")}`)
    .join("; ");
  return `The previous ${invalid.length} question(s) failed validation: ${details}.`;
}
