import { describe, expect, it } from "bun:test";
import { formatsForSection, sectionMaterialInstruction, supportsSectionFormat } from "../practice-policy";
import { generationInputSchema, questionSchema } from "../schemas";
import { repairAndParseQuestions } from "../repair";

describe("four-skill practice", () => {
  it("keeps subjective and objective formats in their own sections", () => {
    expect(formatsForSection("WRITING", ["multiple_choice", "essay", "spoken_response"])).toEqual(["essay"]);
    expect(formatsForSection("SPEAKING", ["essay", "spoken_response"])).toEqual(["spoken_response"]);
    expect(formatsForSection("LISTENING", ["multiple_choice", "essay"])).toEqual(["multiple_choice"]);
    expect(supportsSectionFormat("READING", "essay")).toBe(false);
  });
  it("accepts saved writing and speaking questions without answer options", () => {
    for (const format of ["essay", "spoken_response"]) {
      expect(questionSchema.safeParse({ format, passageText: "A realistic assignment background with enough context to respond.", questionText: "Explain your opinion with supporting examples.", correctAnswer: "A reference response.", explanation: "Assess task fulfillment and language.", difficulty: 3, skillTags: ["expression"] }).success).toBe(true);
    }
    expect(generationInputSchema.shape.section.safeParse("WRITING").success).toBe(true);
  });
  it("generates audio scripts and task cues rather than relabelled reading passages", () => {
    expect(sectionMaterialInstruction("LISTENING")).toContain("audio playback");
    expect(sectionMaterialInstruction("WRITING")).toContain("not an exact-match answer");
    expect(sectionMaterialInstruction("SPEAKING")).toContain("Do not claim to assess pronunciation");
  });
  it("rejects provider output that turns writing into a reading multiple choice question", () => {
    const result = repairAndParseQuestions([{ format: "multiple_choice", passageText: "An assignment with enough background and requirements for the learner.", questionText: "Which statement is accurate?", correctAnswer: "A", explanation: "选项 A 与原文内容一致。", difficulty: 3, skillTags: ["detail"], options: [{ key: "A", text: "A factual statement" }, { key: "B", text: "An unrelated statement" }] }], "", { section: "WRITING", allowedFormats: ["essay"], strictExplanation: false });
    expect(result.valid).toHaveLength(0);
    expect(result.invalid[0]!.errors).toContain("Question format does not match the selected section");
  });
});
