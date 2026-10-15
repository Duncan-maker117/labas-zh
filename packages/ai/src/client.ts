import { reserveTokenBudget } from "./token-budget";
import {
  extractContentFromCompletionBody,
  isLikelyTruncatedJson,
  looksLikeHtmlErrorPage,
  stripReasoningBlocks,
} from "./parse-response";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
}

export interface ChatCompletionResult {
  content: string;
  reasoning?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// Simple debug logger that works in both Node and Bun
function log(
  level: "info" | "error" | "warn",
  message: string,
  meta?: Record<string, unknown>,
) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  // eslint-disable-next-line no-console
  console[level](`[${timestamp}] [AI-CLIENT] ${level.toUpperCase()}: ${message}${metaStr}`);
}

function parseSSELine(line: string): { content?: string; reasoning?: string; usage?: ChatCompletionResult["usage"] } | null {
  if (!line.startsWith("data: ")) return null;
  const data = line.slice(6).trim();
  if (data === "[DONE]") return null;
  try {
    const chunk = JSON.parse(data);
    const choice = chunk.choices?.[0];
    const content = choice?.delta?.content ?? choice?.message?.content;
    const reasoning = choice?.delta?.reasoning_content ?? choice?.message?.reasoning_content;
    const usage = chunk.usage;
    return {
      content: typeof content === "string" ? content : undefined,
      reasoning: typeof reasoning === "string" ? reasoning : undefined,
      usage,
    };
  } catch {
    return null;
  }
}

async function readSSEStream(
  reader: any,
  callbacks: StreamCallbacks,
): Promise<{ content: string; reasoning?: string; usage?: ChatCompletionResult["usage"]; rawBody: string }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let rawBody = "";
  let fullContent = "";
  let fullReasoning = "";
  let lastUsage: ChatCompletionResult["usage"] | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkText = decoder.decode(value, { stream: true });
    rawBody += chunkText;
    buffer += chunkText;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith(":")) continue;
      const parsed = parseSSELine(trimmedLine);
      if (!parsed) continue;
      if (parsed.content) {
        fullContent += parsed.content;
        callbacks.onToken(parsed.content);
      }
      if (parsed.reasoning) {
        fullReasoning += parsed.reasoning;
      }
      if (parsed.usage) {
        lastUsage = parsed.usage;
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const parsed = parseSSELine(buffer.trim());
    if (parsed) {
      if (parsed.content) {
        fullContent += parsed.content;
        callbacks.onToken(parsed.content);
      }
      if (parsed.reasoning) {
        fullReasoning += parsed.reasoning;
      }
      if (parsed.usage) {
        lastUsage = parsed.usage;
      }
    }
  }

  if (!fullContent) {
    const nonStreamContent = extractContentFromCompletionBody(rawBody);
    if (nonStreamContent) {
      fullContent = nonStreamContent;
      callbacks.onToken(nonStreamContent);
    }
  }

  return { content: fullContent, reasoning: fullReasoning || undefined, usage: lastUsage, rawBody };
}

const MAX_TRUNCATION_RETRIES = 2;

function isResponseFormatError(status: number, text: string): boolean {
  if (status !== 400 && status !== 422) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes("response_format") ||
    lower.includes("json mode") ||
    lower.includes("json_object") ||
    lower.includes("unsupported parameter")
  );
}

const METADATA_HOSTS = new Set([
  "169.254.169.254",              // AWS / GCP / Azure metadata
  "metadata.google.internal",     // GCP metadata
  "metadata",                     // some cloud providers
  "100.100.100.200",              // Alibaba Cloud metadata
]);

const RFC1918_PATTERN = /^(?:10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)$/;

function isMetadataOrPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (METADATA_HOSTS.has(lower)) return true;
  // Allow loopback (localhost/127.0.0.1/::1) for local model backends
  // Block RFC1918 only in production — dev may have LAN model servers
  if (RFC1918_PATTERN.test(hostname) && process.env.NODE_ENV === "production") return true;
  return false;
}

function sanitizeForLog(text: string, maxLen = 300): string {
  return text
    .replace(/Bearer\s+[^\s"']+/gi, "Bearer [REDACTED]")
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
    .slice(0, maxLen);
}

export class OpenAICompatibleClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async chatCompletion(
    opts: ChatCompletionOptions,
    callbacks?: StreamCallbacks,
  ): Promise<ChatCompletionResult> {
    return this._doChatCompletion(opts, callbacks, { attempt: 1 });
  }

  private async _doChatCompletion(
    opts: ChatCompletionOptions,
    callbacks: StreamCallbacks | undefined,
    ctx: {
      attempt: number;
      truncationRetries?: number;
      retriedForResponseFormat?: boolean;
    },
  ): Promise<ChatCompletionResult> {
    let hostname: string;
    try {
      hostname = new URL(this.baseUrl).hostname;
    } catch {
      throw new Error(`Invalid base URL: ${this.baseUrl}`);
    }

    if (isMetadataOrPrivateHost(hostname)) {
      throw new Error(`Requests to metadata/private network addresses are not allowed`);
    }

    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const stream = true;
    const body: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      stream,
    };
    const budget = reserveTokenBudget(opts.messages, opts.max_tokens ?? 4096);
    if (budget) body.stream_options = { include_usage: true };
    if (opts.max_tokens || budget) body.max_tokens = budget?.maxOutput ?? opts.max_tokens;
    if (opts.response_format && !ctx.retriedForResponseFormat) {
      body.response_format = opts.response_format;
    }

    log("info", "Sending chat completion request", {
      url: sanitizeForLog(url, 200),
      model: opts.model,
      messageCount: opts.messages.length,
      maxTokens: opts.max_tokens,
      stream,
      attempt: ctx.attempt,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });

    log("info", "Received response", {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get("content-type"),
    });

    if (!res.ok) {
      budget?.settle(0);
      const text = await res.text();
      const preview = sanitizeForLog(text, 500);
      log("error", "API request failed", {
        status: res.status,
        statusText: res.statusText,
        preview,
        isHtml: looksLikeHtmlErrorPage(preview),
      });

      // Retry without response_format if provider doesn't support it
      if (!ctx.retriedForResponseFormat && isResponseFormatError(res.status, preview)) {
        log("warn", "Provider rejected response_format, retrying without it");
        return this._doChatCompletion(opts, callbacks, {
          ...ctx,
          attempt: ctx.attempt + 1,
          retriedForResponseFormat: true,
        });
      }

      if (looksLikeHtmlErrorPage(preview)) {
        throw new Error(
          `Upstream returned an HTML error page (status ${res.status}), not AI JSON. ` +
            `Check base URL, proxy, or gateway configuration. ` +
            `Preview: ${preview.slice(0, 200)}`,
        );
      }

      throw new Error(`OpenAI-compatible API error ${res.status}: ${preview}`);
    }

    if (!res.body) {
      throw new Error("Empty response body from API");
    }

    const reader = res.body.getReader() as any;
    let streamResult: Awaited<ReturnType<typeof readSSEStream>>;
    try {
      streamResult = await readSSEStream(reader, callbacks ?? { onToken: () => {} });
    } finally {
      // Also stop the upstream stream when a cancellation callback throws.
      await reader.cancel().catch(() => {});
    }
    const reportedTokens = streamResult.usage?.total_tokens;
    budget?.settle(typeof reportedTokens === "number" && Number.isSafeInteger(reportedTokens) && reportedTokens >= 0
      ? reportedTokens : budget.estimateOutput(streamResult.content, streamResult.reasoning));
    const result = {
      ...streamResult,
      content: stripReasoningBlocks(streamResult.content),
    };

    // Defense: reject actual HTML error pages, not model thinking tags like <think>
    if (looksLikeHtmlErrorPage(result.content)) {
      const preview = result.content.slice(0, 500);
      log("error", "Stream returned HTML error page instead of AI content", {
        preview: preview.slice(0, 200),
      });
      throw new Error(
        `Upstream returned an HTML error page in the stream, not AI JSON. ` +
          `Check base URL, proxy, or gateway configuration. ` +
          `Preview: ${preview.slice(0, 200)}`,
      );
    }

    if (!result.content) {
      throw new Error("Empty response from AI");
    }

    // Truncation detection + retry (incomplete JSON mid-stream)
    const truncationRetries = ctx.truncationRetries ?? 0;
    if (truncationRetries < MAX_TRUNCATION_RETRIES && isLikelyTruncatedJson(result.content)) {
      const baseTokens = opts.max_tokens && opts.max_tokens > 0 ? opts.max_tokens : 8_192;
      const newMaxTokens = Math.min(Math.round(baseTokens * 1.75), 128_000);
      log("warn", "Response looks truncated, retrying with more tokens", {
        originalLength: result.content.length,
        originalMaxTokens: opts.max_tokens,
        newMaxTokens,
        truncationRetry: truncationRetries + 1,
      });
      return this._doChatCompletion(
        { ...opts, max_tokens: newMaxTokens },
        callbacks,
        { ...ctx, attempt: ctx.attempt + 1, truncationRetries: truncationRetries + 1 },
      );
    }

    log("info", "Chat completion successful", {
      contentLength: result.content.length,
      usage: result.usage,
    });

    return result;
  }
}
