import { describe, expect, it } from "bun:test";
import { parseResponseAssessment } from "../assessment";

describe("subjective response assessment", () => {
  it("computes its own score from bounded rubric fields instead of accepting a model total", () => {
    const result = parseResponseAssessment({ criteria: { task: 80, organization: 60, vocabulary: 70, grammar: 50 }, score: 100, feedback: "观点清楚，可改善语法。", improvements: ["补充具体例子。"] });
    expect(result.score).toBe(65);
    expect(result.basis).toBe("text");
  });
  it("rejects malformed or out-of-range assessment output", () => {
    expect(() => parseResponseAssessment({ criteria: { task: 500 }, feedback: "good" })).toThrow();
  });
});
