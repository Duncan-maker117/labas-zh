import { expect, it } from "bun:test";
import { join } from "node:path";

it("runs four-skill persistence and assessment against isolated PostgreSQL", async () => {
  const child = Bun.spawn([process.execPath, "test", join(import.meta.dir, "fixtures/response-evaluation.case.ts")], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code !== 0) throw new Error(`Assessment regression failed:\n${stdout}\n${stderr}`);
  expect(code).toBe(0);
}, 60000);
