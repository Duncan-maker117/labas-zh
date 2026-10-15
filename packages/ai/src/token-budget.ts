import { AsyncLocalStorage } from "node:async_hooks";

const budgets = new AsyncLocalStorage<{ limit: number; used: number }>();

export function withTokenBudget<T>(limit: number | undefined, run: () => Promise<T>): Promise<T> {
  return limit === undefined ? run() : budgets.run({ limit, used: 0 }, run);
}

export function getTokenBudgetUsage(): number | undefined {
  return budgets.getStore()?.used;
}

/** Reserve every provider attempt, including retries and parallel shards. UTF-8
 * bytes conservatively estimate input when a provider does not report usage. */
export function reserveTokenBudget(messages: Array<{ content: string }>, requestedOutput: number) {
  const budget = budgets.getStore();
  if (!budget) return null;
  const promptEstimate = messages.reduce((n, message) => n + Buffer.byteLength(message.content, "utf8") + 64, 128);
  const maxOutput = Math.min(requestedOutput, budget.limit - budget.used - promptEstimate);
  if (maxOutput < 256) throw new Error("Platform AI task budget exhausted");
  const reserved = promptEstimate + maxOutput;
  budget.used += reserved;
  let settled = false;
  return {
    maxOutput,
    settle(tokens: number) {
      if (settled) return;
      settled = true;
      budget.used += Math.max(0, Math.ceil(tokens)) - reserved;
    },
    estimateOutput(content: string, reasoning = "") {
      return Math.min(reserved, promptEstimate + Buffer.byteLength(content + reasoning, "utf8"));
    },
  };
}
