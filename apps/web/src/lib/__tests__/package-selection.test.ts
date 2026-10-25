import { expect, it } from "bun:test";
import { groupBundleQuestions, selectBundleQuestions } from "../package-selection";

const questions = [
  { id: "read", examTypeId: "TOEFL", sectionTypeId: "READING", difficulty: 4 },
  { id: "listen", examTypeId: "TOEFL", sectionTypeId: "LISTENING", difficulty: 2 },
  { id: "write", examTypeId: "TOEFL", sectionTypeId: "WRITING", difficulty: 3 },
  { id: "foreign", examTypeId: "IELTS", sectionTypeId: "READING", difficulty: 1 },
];
it("keeps mixed-skill questions in their real sections when no subject filter is chosen", () => {
  const picked = selectBundleQuestions(questions, "TOEFL", undefined, 10, "difficulty");
  expect(picked.map((q) => q.id)).toEqual(["listen", "write", "read"]);
  expect(groupBundleQuestions(picked).map((group) => [group.sectionTypeId, group.questions.map((q) => q.id)])).toEqual([["LISTENING", ["listen"]], ["WRITING", ["write"]], ["READING", ["read"]]]);
});
it("never fills a subject-specific set from unrelated subjects or another exam", () => {
  expect(selectBundleQuestions(questions, "TOEFL", "READING", 10, "random").map((q) => q.id)).toEqual(["read"]);
});
it("does not fabricate questions for an empty bank or a zero request", () => {
  expect(selectBundleQuestions([], "TOEFL", undefined, 10, "random")).toEqual([]);
  expect(selectBundleQuestions(questions, "TOEFL", undefined, 0, "random")).toEqual([]);
  expect(groupBundleQuestions([])).toEqual([]);
});
