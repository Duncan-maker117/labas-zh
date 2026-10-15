import { describe, expect, it, spyOn } from "bun:test";
import { OpenAICompatibleClient } from "../client";
import { withTokenBudget, getTokenBudgetUsage } from "../token-budget";

describe("platform token budget", () => {
  it("rejects a provider call before sending it when the job budget is too small", async () => {
    const client = new OpenAICompatibleClient("https://example.invalid/v1", "test");
    await expect(withTokenBudget(10, () => client.chatCompletion({
      model: "test", messages: [{ role: "user", content: "a".repeat(200) }], max_tokens: 100,
    }))).rejects.toThrow("Platform AI task budget exhausted");
  });
  it("settles provider-reported usage across multiple calls instead of counting requests", async () => {
    const transport = spyOn(globalThis, "fetch").mockImplementation(async () => new Response(
      'data: {"choices":[{"delta":{"content":"{}"}}],"usage":{"total_tokens":300}}\n\ndata: [DONE]\n\n',
      { headers: { "content-type": "text/event-stream" } },
    ));
    try {
      const client = new OpenAICompatibleClient("https://example.invalid/v1", "test");
      await withTokenBudget(1300, async () => {
        const options = { model: "test", messages: [{ role: "user" as const, content: "Hi" }], max_tokens: 1000 };
        expect((await client.chatCompletion(options)).content).toBe("{}");
        expect((await client.chatCompletion(options)).content).toBe("{}");
        expect(getTokenBudgetUsage()).toBe(600);
        await expect(client.chatCompletion({ ...options, messages: [{ role: "user", content: "a".repeat(2000) }] })).rejects.toThrow("budget exhausted");
      });
      expect(transport).toHaveBeenCalledTimes(2);
    } finally { transport.mockRestore(); }
  });
  it("prevents parallel shards from spending the same remaining budget", async () => {
    const transport = spyOn(globalThis, "fetch").mockImplementation(async () => new Response(
      'data: {"choices":[{"delta":{"content":"{}"}}],"usage":{"total_tokens":300}}\n\ndata: [DONE]\n\n',
    ));
    try {
      const client = new OpenAICompatibleClient("https://example.invalid/v1", "test");
      await withTokenBudget(1500, async () => {
        const options = { model: "test", messages: [{ role: "user" as const, content: "Hi" }], max_tokens: 1000 };
        const results = await Promise.allSettled([client.chatCompletion(options), client.chatCompletion(options)]);
        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(getTokenBudgetUsage()).toBe(300);
      });
      expect(transport).toHaveBeenCalledTimes(1);
    } finally { transport.mockRestore(); }
  });
});
