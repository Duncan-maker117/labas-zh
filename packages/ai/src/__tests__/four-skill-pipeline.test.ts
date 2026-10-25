import { afterEach, expect, it } from "bun:test";
import { generateQuestionsQuick } from "../pipeline";
import { generateQuestionsAgentic } from "../agentic";
import { getGenericQuestionJsonSchemaDescription } from "../repair";
import type { GenerationInput } from "../schemas";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
for (const section of ["LISTENING", "WRITING", "SPEAKING"] as const) {
  for (const mode of ["quick", "agentic"] as const) {
    it(`${mode} generates and parses ${section} through the provider boundary`, async () => {
      const format = section === "WRITING" ? "essay" : section === "SPEAKING" ? "spoken_response" : "multiple_choice";
      const input: GenerationInput = { examType: "TOEFL", section, formats: [format], difficulty: 3, topics: ["Education"], questionCount: 1, mode, apiKeyConfig: { baseUrl: "https://pipeline.invalid/v1", apiKey: "simulated", model: "test", maxTokens: 4096 } };
      const material = "Describe an educational experience and explain how it changed your learning habits.";
      const q = { format, passageText: material, questionText: "Describe a useful educational experience with examples.", correctAnswer: format === "multiple_choice" ? "A" : "A complete reference response, not an answer key.", explanation: "应围绕学习经历展开，并提供具体例子支持观点。", difficulty: 3, skillTags: ["expression"], ...(format === "multiple_choice" ? { options: [{ key: "A", text: "Learning habits changed" }, { key: "B", text: "The class was cancelled" }, { key: "C", text: "The library closed" }, { key: "D", text: "The fee increased" }] } : {}) };
      let calls = 0;
      globalThis.fetch = (async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const prompt = body.messages.at(-1).content as string;
        calls++;
        const output = prompt.startsWith("Generate authentic, high-quality material") ? { passage: material, title: "Learning" } : prompt.startsWith("Validate this") ? { isValid: true, feedback: "Appropriate", score: 9 } : prompt.startsWith("You are a strict exam validator") ? { overallConfidence: 95, issues: [], needsRevision: false } : { questions: [q] };
        const content = JSON.stringify(output);
        return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: ${JSON.stringify({ choices: [], usage: { total_tokens: 300 } })}\n\ndata: [DONE]\n\n`, { headers: { "Content-Type": "text/event-stream" } });
      }) as typeof fetch;
      const result = mode === "quick" ? await generateQuestionsQuick(input) : await generateQuestionsAgentic(input);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]!.format).toBe(format);
      expect(result.questions[0]!.correctAnswer).toBe(q.correctAnswer);
      expect(calls).toBe(mode === "quick" ? 1 : 4);
      const generic = JSON.parse(getGenericQuestionJsonSchemaDescription());
      expect(generic.properties.questions.items.properties.format.enum).toContain(format);
    });
  }
}
