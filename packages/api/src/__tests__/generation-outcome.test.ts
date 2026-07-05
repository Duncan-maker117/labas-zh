import { describe, expect, it } from "bun:test";
import {
  collectShardFailureCause,
  formatGenerationErrorMessage,
  isNonRetryableProviderError,
  resolveGenerationJobOutcome,
  sectionsWithNoQuestions,
} from "../lib/generation-outcome";

describe("isNonRetryableProviderError", () => {
  it("detects OpenAI-compatible 500 errors", () => {
    expect(
      isNonRetryableProviderError(
        new Error('OpenAI-compatible API error 500: {"error":{"message":"litellm.MidStreamFallbackError"}}'),
      ),
    ).toBe(true);
  });

  it("detects LiteLLM connection errors", () => {
    expect(isNonRetryableProviderError(new Error("litellm.APIConnectionError: upstream failed"))).toBe(
      true,
    );
  });

  it("returns false for JSON parse failures", () => {
    expect(isNonRetryableProviderError(new Error("Failed to parse AI response as JSON"))).toBe(false);
  });

  it("detects upstream HTML error pages", () => {
    expect(
      isNonRetryableProviderError(
        new Error("Upstream returned an HTML error page in the stream, not AI JSON."),
      ),
    ).toBe(true);
  });
});

describe("resolveGenerationJobOutcome", () => {
  it("marks full success as completed", () => {
    expect(
      resolveGenerationJobOutcome({ requestedCount: 20, generatedCount: 20 }),
    ).toEqual({
      status: "completed",
      progressMessage: "Completed",
      errorMessage: null,
    });
  });

  it("marks partial success as completed_partial", () => {
    const outcome = resolveGenerationJobOutcome({
      requestedCount: 20,
      generatedCount: 4,
      failedSections: ["LISTENING"],
    });
    expect(outcome.status).toBe("completed_partial");
    expect(outcome.errorMessage).toContain("4 dari 20");
    expect(outcome.errorMessage).toContain("LISTENING");
  });

  it("marks zero questions as failed without blaming provider when cause is unknown", () => {
    const outcome = resolveGenerationJobOutcome({
      requestedCount: 20,
      generatedCount: 0,
      failedSections: ["READING", "LISTENING"],
    });
    expect(outcome.status).toBe("failed");
    expect(outcome.errorMessage).toContain("Tidak ada soal");
    expect(outcome.errorMessage).not.toContain("Periksa model/API provider");
  });

  it("labels truncated JSON with actionable guidance", () => {
    const message = formatGenerationErrorMessage({
      cause: "JSON response was truncated before completion (usually max_tokens too low). Preview: {\"title\":",
      failedSections: ["READING"],
    });
    expect(message).toContain("terpotong");
    expect(message).toContain("Max Tokens");
  });

  it("surfaces JSON parse cause instead of generic provider hint", () => {
    const outcome = resolveGenerationJobOutcome({
      requestedCount: 5,
      generatedCount: 0,
      failedSections: ["READING"],
      cause: "Failed to parse AI response as JSON: Unexpected token. Preview: {broken",
    });
    expect(outcome.errorMessage).toContain("tidak valid JSON");
    expect(outcome.errorMessage).toContain("Failed to parse AI response");
    expect(outcome.errorMessage).not.toContain("Periksa model/API provider");
  });
});

describe("formatGenerationErrorMessage", () => {
  it("labels upstream provider failures clearly", () => {
    const message = formatGenerationErrorMessage({
      cause: "OpenAI-compatible API error 500: upstream timeout",
      failedSections: ["READING"],
    });
    expect(message).toContain("Gagal menghubungi API provider");
    expect(message).toContain("500");
  });

  it("detects legacy false-positive HTML guard on reasoning output", () => {
    const message = formatGenerationErrorMessage({
      cause:
        "Provider returned HTML in stream instead of JSON. Preview: <think>planning",
      failedSections: ["READING"],
    });
    expect(message).toContain("reasoning tidak kompatibel");
    expect(message).not.toContain("Gagal menghubungi API provider");
  });
});

describe("sectionsWithNoQuestions", () => {
  it("returns sections missing from generated questions", () => {
    expect(
      sectionsWithNoQuestions(
        [
          { section: "READING", count: 10 },
          { section: "LISTENING", count: 10 },
        ],
        [{ section: "READING" }, { section: "READING" }],
      ),
    ).toEqual(["LISTENING"]);
  });
});
