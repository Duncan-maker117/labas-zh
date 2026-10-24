import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { getLocalAdminDatabaseUrl } from "@labas/api/lib/local-admin-config";

const root = resolve(import.meta.dir, "../../../..");
const usage = "用法：本机运行 scripts/setup-admin.ps1，或使用 --list / --grant <账号ID> --confirm。";
const args = process.argv.slice(2);
if (!(args.length === 1 && args[0] === "--list") && !(args.length === 3 && args[0] === "--grant" && args[1] && args[2] === "--confirm")) {
  console.error(usage);
  process.exit(1);
}

try {
  const server = dotenv.parse(readFileSync(resolve(root, "apps/server/.env")));
  const compose = dotenv.parse(readFileSync(resolve(root, "deploy/.env.local")));
  const databaseUrl = getLocalAdminDatabaseUrl(server, compose, process.env);
  for (const [key, value] of Object.entries(server)) if (process.env[key] === undefined) process.env[key] = value;
  process.env.DATABASE_URL = databaseUrl;
  const { db } = await import("@labas/db");
  try {
    const { getLocalAdminCandidates, grantInitialLocalAdmin } = await import("@labas/api/lib/local-admin");
    const result = args[0] === "--list" ? await getLocalAdminCandidates() : await grantInitialLocalAdmin(args[1]!);
    console.log(JSON.stringify(result));
  } finally {
    await db.$client.end();
  }
} catch {
  // Do not print a database URL, SQL parameters, credentials, or a stack trace.
  console.error("操作未完成。工具仅允许连接本项目的本地开发库；请检查本地服务、账号状态，或是否已有管理员。");
  process.exitCode = 1;
}
