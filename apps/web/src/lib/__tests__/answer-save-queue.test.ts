import { expect, it } from "bun:test";
import { AnswerSaveQueue } from "../answer-save-queue";

it("flush waits for the latest text after an older save is already running", async () => {
  const saved: string[] = []; let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  const queue = new AnswerSaveQueue(async (text: string) => { if (text === "old") await blocked; saved.push(text); }, () => {}, 1);
  queue.enqueue("essay", "old"); const flush = queue.flush();
  queue.enqueue("essay", "latest"); release(); await flush;
  expect(saved).toEqual(["old", "latest"]); expect(queue.hasPending).toBe(false);
});
it("retains unsaved text on failure so finish can retry without submitting a partial answer", async () => {
  let failing = true; const saved: string[] = [];
  const queue = new AnswerSaveQueue(async (text: string) => { if (failing) throw new Error("offline"); saved.push(text); }, () => {}, 1);
  queue.enqueue("essay", "full answer"); await expect(queue.flush()).rejects.toThrow("offline");
  expect(queue.hasPending).toBe(true); failing = false; await queue.flush();
  expect(saved).toEqual(["full answer"]);
});
