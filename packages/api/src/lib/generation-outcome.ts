export function isNonRetryableProviderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (/openai-compatible api error 5\d\d/i.test(message)) return true;
  if (/api error 5\d\d/i.test(message)) return true;
  if (lower.includes("midstreamfallbackerror")) return true;
  if (lower.includes("apiconnectionerror")) return true;
  if (lower.includes("upstream returned an html error page")) return true;
  if (lower.includes("provider returned html")) return true;
  if (/\berror 502\b/.test(lower) || /\berror 503\b/.test(lower) || /\berror 504\b/.test(lower)) {
    return true;
  }

  return false;
}

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;
}

function sectionHint(failedSections: string[]): string {
  return failedSections.length > 0 ? ` Section gagal: ${failedSections.join(", ")}.` : "";
}

/** Turn raw pipeline/client errors into user-facing messages that name the real cause. */
export function formatGenerationErrorMessage(input: {
  cause?: string;
  failedSections?: string[];
}): string {
  const failedSections = [...new Set(input.failedSections ?? [])];
  const hint = sectionHint(failedSections);
  const cause = input.cause?.trim();

  if (!cause) {
    return `Tidak ada soal yang berhasil dibuat.${hint}`;
  }

  const lower = cause.toLowerCase();

  if (
    lower.includes("redacted_thinking") ||
    lower.includes("<thinking>") ||
    /<\/?think>/.test(lower)
  ) {
    return `Model reasoning tidak kompatibel dengan parser DUNCAN.${hint} Coba non-reasoning model, atau update server ke versi terbaru.`;
  }

  if (
    lower.includes("json response was truncated") ||
    lower.includes("unterminated string")
  ) {
    return `Respons model terpotong sebelum JSON selesai (biasanya max tokens terlalu kecil).${hint} Naikkan Max Tokens di Settings atau kurangi jumlah soal/format.`;
  }

  if (lower.includes("failed to parse ai response") || lower.includes("invalid json response")) {
    return `Model merespons, tapi output tidak valid JSON.${hint} ${truncate(cause, 280)}`;
  }

  if (lower.includes("empty response from ai") || lower.includes("empty response body")) {
    return `Model tidak mengembalikan konten.${hint} Coba model lain atau kurangi jumlah soal.`;
  }

  if (lower.includes("no valid questions")) {
    return `Model menghasilkan soal, tapi semuanya gagal validasi.${hint} ${truncate(cause, 280)}`;
  }

  if (
    lower.includes("upstream returned an html error page") ||
    lower.includes("provider returned html") ||
    lower.includes("openai-compatible api error") ||
    /api error 5\d\d/i.test(cause) ||
    lower.includes("apiconnectionerror") ||
    lower.includes("midstreamfallbackerror")
  ) {
    return `Gagal menghubungi API provider.${hint} ${truncate(cause, 280)}`;
  }

  if (lower.includes("metadata/private network") || lower.includes("invalid base url")) {
    return `Base URL provider tidak valid atau tidak dapat diakses dari server.${hint}`;
  }

  return `Generasi gagal.${hint} ${truncate(cause, 280)}`;
}

export function resolveGenerationJobOutcome(input: {
  requestedCount: number;
  generatedCount: number;
  failedSections?: string[];
  cause?: string;
}): {
  status: "completed" | "completed_partial" | "failed";
  progressMessage: string;
  errorMessage: string | null;
} {
  const failedSections = [...new Set(input.failedSections ?? [])];

  if (input.generatedCount <= 0) {
    return {
      status: "failed",
      progressMessage: "Generation failed",
      errorMessage: formatGenerationErrorMessage({
        cause: input.cause,
        failedSections,
      }),
    };
  }

  if (input.generatedCount < input.requestedCount) {
    const sectionHintText =
      failedSections.length > 0 ? ` Section gagal: ${failedSections.join(", ")}.` : "";
    return {
      status: "completed_partial",
      progressMessage: `Selesai sebagian: ${input.generatedCount}/${input.requestedCount} soal`,
      errorMessage: `Hanya ${input.generatedCount} dari ${input.requestedCount} soal berhasil dibuat.${sectionHintText}`,
    };
  }

  return {
    status: "completed",
    progressMessage: "Completed",
    errorMessage: null,
  };
}

export function sectionsWithNoQuestions(
  sectionSplits: Array<{ section: string; count: number }>,
  questions: Array<{ section: string }>,
): string[] {
  return sectionSplits
    .filter((split) => !questions.some((q) => q.section === split.section))
    .map((split) => split.section);
}

export function collectShardFailureCause(
  failures: Iterable<{ error: string } | undefined>,
): string | undefined {
  for (const failure of failures) {
    const message = failure?.error?.trim();
    if (message) return message;
  }
  return undefined;
}
