import { expect, it } from "bun:test";
import { join } from "node:path";

it("upgrades the historical question bank and sanitizes HTTP errors", async () => {
  // Bun module mocks are global. Keep this migrated database out of other suites.
  const child = Bun.spawn([process.execPath, "test", join(import.meta.dir, "fixtures/question-migrations.case.ts")], {
    stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  if (code !== 0) throw new Error(`Migration regression failed:\n${stdout}\n${stderr}`);
  expect(code).toBe(0);
}, 30000);
