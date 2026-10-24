import { describe, expect, it } from "bun:test";
import {
  EXAM_TYPES,
  SECTIONS,
  FORMATS,
  TOPICS,
  DIFFICULTIES,
  QUESTION_COUNT_PRESETS,
} from "../generate-constants";

describe("EXAM_TYPES", () => {
  it("offers language exams without Indonesian civil-service exams", () => {
    expect(EXAM_TYPES.map((exam) => exam.id)).toEqual([
      "IELTS", "TOEFL", "JLPT", "HSK", "GOETHE", "TOPIK", "TOAFL", "DELE",
    ]);
  });

  it("each entry has id, name, and code", () => {
    for (const exam of EXAM_TYPES) {
      expect(exam).toHaveProperty("id");
      expect(exam).toHaveProperty("name");
      expect(exam).toHaveProperty("code");
    }
  });

  it("has no duplicate IDs", () => {
    const ids = EXAM_TYPES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("SECTIONS", () => {
  it("offers reading practice with section metadata", () => {
    expect(SECTIONS.map((section) => section.id)).toEqual(["READING"]);
    for (const s of SECTIONS) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
      expect(s).toHaveProperty("icon");
      expect(s).toHaveProperty("allowedExams");
      expect(Array.isArray(s.allowedExams)).toBe(true);
    }
  });

  it("READING is allowed for all language exams", () => {
    const langExams = ["IELTS", "TOEFL", "JLPT", "HSK", "GOETHE", "TOPIK", "TOAFL", "DELE"];
    const reading = SECTIONS.find((s) => s.id === "READING");
    expect(reading?.allowedExams).toEqual(langExams);
  });
});

describe("FORMATS", () => {
  it("excludes Indonesian situational judgment from language practice", () => {
    expect(FORMATS.map((format) => format.id)).not.toContain("situational_judgment");
    for (const format of FORMATS) {
      expect(format.allowedExams).not.toContain("CPNS");
    }
  });

  it("each format has id, name, and allowedExams", () => {
    for (const f of FORMATS) {
      expect(f).toHaveProperty("id");
      expect(f).toHaveProperty("name");
      expect(f).toHaveProperty("allowedExams");
      expect(Array.isArray(f.allowedExams)).toBe(true);
    }
  });

  it("no duplicate format IDs", () => {
    const ids = FORMATS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("TOPICS", () => {
  it("has at least one topic", () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(1);
  });

  it("all topics are strings", () => {
    for (const t of TOPICS) {
      expect(typeof t).toBe("string");
    }
  });
});

describe("DIFFICULTIES", () => {
  it("has 5 difficulty strings", () => {
    expect(DIFFICULTIES).toHaveLength(5);
  });
});

describe("QUESTION_COUNT_PRESETS", () => {
  it("has 4 presets", () => {
    expect(QUESTION_COUNT_PRESETS).toHaveLength(4);
  });

  it("each preset has value, label, and desc", () => {
    for (const p of QUESTION_COUNT_PRESETS) {
      expect(p).toHaveProperty("value");
      expect(p).toHaveProperty("label");
      expect(p).toHaveProperty("desc");
    }
  });
});
