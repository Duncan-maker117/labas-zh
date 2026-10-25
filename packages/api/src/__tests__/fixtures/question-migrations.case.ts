import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { mkdtemp, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as schema from "../../../../db/src/schema";

// Build the old database from shipped migrations, never the hand-written test schema.
const migrationsFolder = join(import.meta.dir, "../../../../db/src/migrations");
const pg = new PGlite();
const testDb = drizzle(pg, { schema });
mock.module("@labas/db", () => ({ ...schema, db: testDb }));

const { questionRouter } = await import("../../routers/question");
const guest = questionRouter.createCaller({ session: null, auth: null, ip: "127.0.0.1" });
const owner = questionRouter.createCaller({
  session: { user: { id: "migration-owner" } } as never,
  auth: null,
  ip: "127.0.0.1",
});
let oldFolder: string;
let before: Record<string, unknown>;

async function records() {
  const result: Record<string, unknown> = {};
  for (const table of ["user", "account", "session", "question", "test_attempt", "platform_config"]) {
    result[table] = (await pg.query(`SELECT to_jsonb(t) - 'passage_id' - 'match_targets' AS row FROM "${table}" t ORDER BY to_jsonb(t)::text`)).rows;
  }
  return result;
}

beforeAll(async () => {
  const journal = JSON.parse(await readFile(join(migrationsFolder, "meta/_journal.json"), "utf8"));
  oldFolder = await mkdtemp(join(tmpdir(), "labas-old-migrations-"));
  const { mkdir } = await import("node:fs/promises");
  await mkdir(join(oldFolder, "meta"));
  const entries = journal.entries.filter((entry: { idx: number }) => entry.idx <= 8);
  await writeFile(join(oldFolder, "meta/_journal.json"), JSON.stringify({ ...journal, entries }));
  for (const entry of entries) await copyFile(join(migrationsFolder, `${entry.tag}.sql`), join(oldFolder, `${entry.tag}.sql`));
  await migrate(testDb, { migrationsFolder: oldFolder });
  await pg.exec(`
    INSERT INTO "user" (id,name,email,role) VALUES ('migration-owner','Owner','owner@example.test','admin'), ('migration-other','Other','other@example.test','user');
    INSERT INTO account (id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES ('account','migration-owner','credential','migration-owner','simulated-hash',now(),now());
    INSERT INTO session (id,token,user_id,expires_at,updated_at) VALUES ('session','simulated-token','migration-owner',now() + interval '1 day',now());
    INSERT INTO exam_type (id,name,language) VALUES ('TOEFL','TOEFL','English'),('IELTS','IELTS','English');
    INSERT INTO section_type (id,name) VALUES ('READING','Reading');
    INSERT INTO question (exam_type_id,section_type_id,format,passage_text,question_text,correct_answer,creator_user_id,is_public) VALUES
      ('TOEFL','READING','multiple_choice','Original inline passage','Public TOEFL','A','migration-owner',true),
      ('TOEFL','READING','multiple_choice','Private inline passage','Private TOEFL','A','migration-owner',false),
      ('IELTS','READING','multiple_choice','Other passage','Other private IELTS','A','migration-other',false);
    INSERT INTO test_attempt (user_id,status) VALUES ('migration-owner','completed');
    INSERT INTO platform_config (key,value) VALUES ('migration-test','keep-me');
  `);
  before = await records();
}, 30000);

afterAll(async () => {
  await pg.close();
  if (oldFolder) await rm(oldFolder, { recursive: true, force: true });
});

describe("question bank migration upgrade", () => {
  it("reproduces the missing-column failure on the actual 0008 schema", async () => {
    expect((await pg.query("SELECT to_regclass('public.passage') AS name")).rows).toEqual([{ name: null }]);
    await expect(guest.list({ examTypeId: "TOEFL" })).rejects.toThrow(/Failed query/);
  });

  it("returns a safe HTTP error for the real failed SQL query", async () => {
    const input = encodeURIComponent(JSON.stringify({ examTypeId: "TOEFL", search: "private-parameter-sentinel" }));
    const response = await fetchRequestHandler({
      endpoint: "/trpc", req: new Request(`http://localhost/trpc/list?input=${input}`),
      router: questionRouter, createContext: () => ({ session: null, auth: null, ip: "127.0.0.1" }),
    });
    const body = await response.text();
    expect(response.status).toBe(500);
    expect(body).toContain("Internal server error");
    expect(body).not.toMatch(/select |passage_id|match_targets|private-parameter-sentinel|stack|params/i);
  });

  it("upgrades via pending migrations and preserves legacy records and visibility", async () => {
    await migrate(testDb, { migrationsFolder });
    expect(await records()).toEqual(before);
    const publicResult = await guest.list({ examTypeId: "TOEFL", isPublic: true });
    expect(publicResult.total).toBe(1);
    expect(publicResult.questions[0]?.passageId).toBeNull();
    expect(publicResult.questions[0]?.matchTargets).toBeNull();
    expect(publicResult.questions[0]?.passageText).toBe("Original inline passage");
    const mine = await owner.list({ creatorUserId: "migration-owner", examTypeId: "TOEFL" });
    expect(mine.total).toBe(2);
    expect((await guest.list({ creatorUserId: "migration-owner" })).total).toBe(1);
    expect((await guest.list({ examTypeId: "IELTS" })).total).toBe(0);
    await migrate(testDb, { migrationsFolder });
    expect(await records()).toEqual(before);
  });

  it("supports shared passages and keeps old inline questions when a passage is deleted", async () => {
    const [text] = await testDb.insert(schema.passage).values({ text: "Shared", examTypeId: "TOEFL", sectionTypeId: "READING", creatorUserId: "migration-owner" }).returning();
    const { eq } = await import("drizzle-orm");
    const question = (await owner.list({ search: "Public TOEFL" })).questions[0]!;
    await testDb.update(schema.question).set({ passageId: text!.id, matchTargets: ["A", "B"] }).where(eq(schema.question.id, question.id));
    expect((await guest.list({ search: "Public TOEFL" })).questions[0]?.matchTargets).toEqual(["A", "B"]);
    await testDb.delete(schema.passage).where(eq(schema.passage.id, text!.id));
    expect((await guest.list({ search: "Public TOEFL" })).questions[0]?.passageId).toBeNull();
  });

  it("preserves authentication, permission and validation errors without exposing stacks", async () => {
    for (const [path, input, status, message] of [
      ["myQuestions", undefined, 401, "Authentication required"],
      ["getById", { id: "invalid" }, 400, "Invalid UUID"],
    ] as const) {
      const response = await fetchRequestHandler({
        endpoint: "/trpc", req: new Request(`http://localhost/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input) ?? "null")}`),
        router: questionRouter, createContext: () => ({ session: null, auth: null, ip: "127.0.0.1" }),
      });
      const body = await response.text();
      expect(response.status).toBe(status);
      expect(body).toContain(message);
      expect(body).not.toContain('"stack"');
    }
    const foreign = (await testDb.select().from(schema.question)).find((row) => row.creatorUserId === "migration-other")!;
    await expect(owner.delete({ id: foreign.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await testDb.select().from(schema.question)).length).toBe(3);
  });
});
