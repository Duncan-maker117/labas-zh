import { describe, expect, it } from "bun:test";
import { EXAM_CATALOG, getExamFormats, getExamProfile, getExamSections, examGenerationInstruction } from "../exam-catalog";
import { formatsForSection, supportsSectionFormat } from "../practice-policy";
import { buildQuickModePrompt } from "../prompts";
import { questionFormatSchema } from "../schemas";

describe("exam-specific practice scope", () => {
  it("removes IELTS judgement formats from TOEFL and keeps all four TOEFL skills", () => {
    expect(getExamSections("TOEFL").map((s) => s.id)).toEqual(["READING", "LISTENING", "WRITING", "SPEAKING"]);
    expect(supportsSectionFormat("READING", "true_false_not_given", "TOEFL")).toBe(false);
    expect(supportsSectionFormat("READING", "true_false_not_given", "IELTS")).toBe(true);
    expect(supportsSectionFormat("LISTENING", "true_false_not_given", "IELTS")).toBe(false);
    expect(formatsForSection("WRITING", ["essay", "sentence_arrangement", "matching_headings"], "TOEFL")).toEqual(["essay", "sentence_arrangement"]);
  });
  it("offers language knowledge, reading and listening for JLPT without inventing productive skills", () => {
    expect(getExamSections("JLPT").map((s) => s.id)).toEqual(["READING", "LISTENING"]);
    expect(getExamSections("JLPT")[0]!.name).toBe("Language knowledge & reading");
    expect(getExamFormats("JLPT", "WRITING")).toEqual([]);
    expect(getExamFormats("JLPT", "READING")).toContain("kanji_reading");
  });
  it("distinguishes TOPIK papers and HSK written levels from separate speaking tests", () => {
    expect(getExamSections("TOPIK", "topik_i").map((s) => s.id)).toEqual(["READING", "LISTENING"]);
    expect(getExamSections("TOPIK", "topik_ii").map((s) => s.id)).toContain("WRITING");
    expect(getExamSections("TOPIK", "topik_speaking").map((s) => s.id)).toEqual(["SPEAKING"]);
    expect(getExamSections("HSK", "hsk_2").map((s) => s.id)).toEqual(["READING", "LISTENING"]);
    expect(getExamFormats("HSK", "WRITING", "hsk_3")).toEqual(["fill_blank", "sentence_arrangement"]);
    expect(getExamSections("HSK", "hskk").map((s) => s.id)).toEqual(["SPEAKING"]);
  });
  it("uses the institution-specific TOAFL scope rather than four universal skills", () => {
    expect(getExamSections("TOAFL").map((s) => s.id)).toEqual(["READING", "LISTENING"]);
    expect(getExamFormats("TOAFL", "READING")).toContain("error_recognition");
    expect(EXAM_CATALOG.TOAFL!.note).toContain("varies by institution");
  });
  it("references official sources and uses only implemented response schemas", () => {
    for (const [exam, spec] of Object.entries(EXAM_CATALOG)) {
      expect(spec.sources.length).toBeGreaterThan(0);
      for (const profile of spec.profiles) {
        expect(getExamProfile(exam, profile.id)!.id).toBe(profile.id);
        for (const section of profile.sections) {
          expect(section.formats.length).toBeGreaterThan(0);
          for (const format of section.formats) expect(questionFormatSchema.safeParse(format).success).toBe(true);
        }
      }
    }
  });
  it("passes the selected official scope into the actual generation prompt", () => {
    const prompt = buildQuickModePrompt({ examType: "TOPIK", examProfile: "topik_ii", section: "WRITING", formats: ["essay"], difficulty: 3, topics: ["Education"], questionCount: 1, mode: "quick", apiKeyConfig: { baseUrl: "https://example.invalid/v1", apiKey: "test", model: "test", maxTokens: 4096 } });
    expect(prompt).toContain("Exam profile: TOPIK II");
    expect(prompt).toContain("describe data");
    expect(examGenerationInstruction("TOEFL", "WRITING")).toContain("Build a Sentence");
  });
});
