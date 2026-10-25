import { describe, expect, it } from "bun:test";
import { difficultyLabel, formatLabel, sectionLabel } from "../format";
import translations from "../ui-translations.json";
import { SECTIONS } from "../exam-constants";

const zh = (source: string) => (translations["zh-CN"] as Record<string, string>)[source] ?? source;

describe("formatLabel", () => {
  it("uses canonical format labels so translations match", () => {
    expect(formatLabel("multiple_choice")).toBe("Multiple Choice");
    expect(formatLabel("true_false_not_given")).toBe("True / False / Not Given");
    expect(formatLabel("true_false_not_given", zh)).toBe("判断 / 未提及");
    expect(formatLabel("multiple_choice", zh)).toBe("单项选择");
  });

  it("handles single word", () => {
    expect(formatLabel("cloze")).toBe("Cloze Test");
  });

  it("handles empty string", () => {
    expect(formatLabel("")).toBe("");
  });

  it("handles already spaced string", () => {
    expect(formatLabel("multiple choice")).toBe("Multiple Choice");
  });
});

describe("question bank subject and difficulty labels", () => {
  it("offers all persisted language skill categories instead of inheriting the AI reading restriction", () => {
    expect(SECTIONS.map((section) => section.id)).toEqual(["READING", "LISTENING", "WRITING", "SPEAKING"]);
  });

  it("localizes both stored IDs and returned section names", () => {
    expect(sectionLabel("READING", zh)).toBe("阅读");
    expect(sectionLabel("Listening", zh)).toBe("听力");
    expect(sectionLabel("WRITING", zh)).toBe("写作");
    expect(sectionLabel("SPEAKING", zh)).toBe("口语");
    expect(sectionLabel("User-created subject", zh)).toBe("User-created subject");
  });

  it("localizes difficulty names without displaying storage values", () => {
    expect(difficultyLabel(1, zh)).toBe("入门");
    expect(difficultyLabel(4, zh)).toBe("高级");
    expect(difficultyLabel(5, zh)).toBe("精通");
  });
});
