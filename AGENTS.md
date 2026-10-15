# Labas 中文版项目规则

本文件是项目级规则，适用于整个仓库；进入任何目录后，先读本文件和该子目录自己的 `AGENTS.md`。子目录规则可以补充细节，不能绕过下列数据安全、Git 和支付要求。

## 项目目标

- 这是面向中文用户的外语考试练习产品，中文为默认界面语言；英语、日语、韩语等是用户学习的目标语言，不能因为界面中文化而移除这些考试。
- 保留登录、题库、练习套题、考试模拟、成绩/历史、学习分析、AI 出题等核心能力。
- 印尼 CPNS/Kedinasan 与当前产品定位无关：默认不出现在导航和新流程中，旧 `/cpns/*` 地址应有明确处理。移除前端入口不等于可以删除历史记录、数据库表或生成数据。
- 用户会持续修改页面和功能。每次变更都要小而聚焦，可从 Git diff 看清楚，不做顺手重构或跨模块大改。
- 本地源码修改由用户自行部署。未经用户明确要求，不登录、发布或修改任何线上站点，也不向上游仓库推送。

## 模块边界

| 目录 | 负责内容 | 不要放入的内容 |
|---|---|---|
| `apps/web/src/routes/` | 路由定义、加载/重定向、页面级数据装配 | 复杂共享业务逻辑、大块重复 UI |
| `apps/web/src/components/routes/` | Dashboard、题库、练习、设置等页面视图 | 数据库访问、支付签名校验 |
| `apps/web/src/components/`、`hooks/`、`lib/` | 可复用 UI、前端状态/交互、浏览器工具、语言文案 | 服务端权限判定、密钥、支付凭据 |
| `packages/api/src/routers/` | tRPC 输入校验、授权、业务流程和数据读写 | React/UI、直接信任前端传来的权限标志 |
| `packages/ai/` | AI provider、提示词、生成 schema 与 AI 流程 | 页面文案、支付状态 |
| `packages/db/` | Drizzle schema、迁移、查询和种子数据 | 绕过迁移直接改生产数据库 |
| `packages/auth/` | Better Auth 与身份认证配置 | 产品角色之外的临时 UI 状态 |
| `apps/server/` | Hono 入口、HTTP 中间件、后台任务/回调接入 | 页面组件和业务规则副本 |
| `packages/ui/` | 多页面复用的基础 UI 组件和设计系统 | 单页面专用业务组件 |

跨包只通过既有 workspace API 和公开导出协作；不得让 `apps/*` 互相导入内部源码。新功能先找现有模块和调用链，不要建立重复的第二套实现。

## 每次改动的工作方式

1. 先确认用户要解决的场景、当前实现位置和受影响流程；说明修改原因、范围及主要风险。
2. 先读相关组件、路由、API、数据库 schema 和本目录规则；按数据流从页面到后端追踪，不凭文件名推断行为。
3. 选择最小改动面。页面结构、API 合约、数据库 schema 和 AI prompt 分层修改，不把它们塞进一个巨型组件。
4. 改完检查 `git diff` 与 `git diff --check`；依赖可用时按需运行仓库的 `bun run check-types`、`bun run build`。没有实际运行的检查不得报告为通过。
5. 按下方 Git 要求自动创建本地回退点，不覆盖用户已有修改，不执行 `git reset`/`clean`/强制操作。用户要求本地启动时，可安装锁文件声明的必要依赖；新增依赖须说明用途。推送和部署仍需用户明确要求。
6. 涉及删路由或数据模型时，先兼容旧链接和历史数据；需要迁移时给出可回滚方案。禁止在没有用户明确要求时连接或写入真实数据库、执行 `db:push`、迁移或 seed。
7. 汇报实际改了什么、检查结果、未完成项和真实阻碍；不要把上游 README 的功能说成当前部署已验证的能力。

## 中文与多语言

- 默认 locale 为 `zh-CN`，用户界面文案集中在 locale/i18n 层；新增页面文案不能继续零散硬编码印尼语。
- 目标语言试题、考试名称、题干、选项和用户提交内容保持原文；只翻译导航、操作提示、错误说明和产品说明。
- 改一个公共按键或标签时，检查桌面、移动端、加载/空/错误状态以及无障碍名称，避免出现一个页面改了、另一个入口仍是旧文案。
- 新增语言需提供完整对应文案或清晰回退规则；不能只改 `<html lang>` 就宣称全站完成本地化。

## 未来收费功能的边界

用户提到未来可能收费，这表示需要保留清晰扩展边界；当前不代表已经选定支付渠道或授权接入任何支付服务。开始收费开发前先单独确认套餐、计费周期、退款/取消规则、目标市场和支付服务商。

- 订阅、支付和权益是独立的 billing/entitlement 领域；不要把订阅等同于现有 `user_credit`，也不要用前端按钮隐藏来实现付费权限。
- 后续数据模型放在 `packages/db`，服务端接口与统一权益检查放在 `packages/api`，Webhook/回调的验签、幂等和状态同步放在 `apps/server` 或独立 server 模块，Pricing/Billing 页面放在 `apps/web`。
- 权益必须在服务端对生成、导出等受限操作做校验；前端显示仅负责提示。支付回调必须校验签名、处理重复事件，并保留可审计的事件记录。
- 不在代码中写入 API key、支付密钥、Webhook secret；只扩充 `.env.example` 变量说明，真实密钥由部署环境配置。
- 不因准备收费而预先引入无用表或 provider SDK；先定义接口和状态，再按用户确认的支付渠道实现，保持可替换、可回滚。
- 仓库当前含 AGPL-3.0 许可。部署修改版网络服务前，需把许可证与源码提供义务纳入发布方案；作者另行授权是否适用要有明确依据。

## Git 回溯要求

- 用户已明确要求：此网站后续每个完整、聚焦的改动，都要在本地 Git 中留有记录，便于撤回和追溯。完成一项独立改动后，先检查 `git diff`、`git diff --check` 和 `git status`，再创建带清楚范围的本地提交。
- 一次提交只包含该项任务的相关文件；发现无法确认归属的用户改动时，保留未提交并说明。不要用 `reset`、`clean` 或覆盖历史来整理工作区。
- 用户负责部署；本地提交不代表授权推送。除非用户另行明确要求，绝不 `git push`。
- 提交前检查本地 `user.name`/`user.email`。本项目自动保存版本使用仓库级标签 `Codex Local <codex@localhost>`；用户有指定署名时遵循用户要求。该标签仅为本地记录，不需要注册账号或配置真实邮箱，不修改全局 Git 配置。
- 开始新的独立改动前确认已有版本点；完成后再提交。撤回已提交改动优先使用 `git revert <提交号>` 保留历史。代码回退不会恢复数据库、用户记录或订单；数据库结构变更须同时记录备份、迁移和兼容方案。

## 本地 Skills 使用规则

已安装技能位于 `.agents/skills/`，按任务自动读取对应 `SKILL.md` 并执行，不要求用户自行选择；每次只加载相关技能。该目录被 Git 忽略，换电脑时需重新安装或使用可用的同名技能，不能假设它随源码交付。

| 任务 | 优先使用的技能 |
|---|---|
| Hono 路由、中间件、接口和服务启动 | `hono` |
| 注册、登录、会话、Cookie 和身份认证 | `better-auth-best-practices` |
| shadcn 组件、表单、弹窗和共享 UI | `shadcn` |
| workspace、任务、依赖、构建与启动 | `turborepo` |
| React 组件拆分和组合，减少复杂属性和重复实现 | `vercel-composition-patterns` |
| 用户明确要求 UI/可访问性检查时 | `web-design-guidelines` |

## 真实用户与上线边界

- 用户目标是真实可用的多用户系统。账号、题库、练习记录等正式业务数据由后端写入 PostgreSQL；不得用浏览器 localStorage 或假数据冒充服务器数据。localStorage 可保存界面语言等个人显示偏好。
- 必须明确汇报前端、后端、数据库、Redis、邮件和支付分别是否接通；展示页面成功不代表注册、练习、AI 或支付已可用。
- 用户身份、资源归属、管理员角色及未来付费权益都由服务端校验。开发数据库和正式用户库分离；禁止把测试账号、默认密码和开发邮件工具用于正式服务。
- Git 管源码，数据库备份管用户数据。上线前需要备份与恢复验证、HTTPS、密钥管理、错误监控和权限检查；收费功能按独立需求实现，未完成时不得展示为可购买。

## SQL 与数据库使用

- 数据库为 PostgreSQL，ORM 为 Drizzle；schema 源文件位于 `packages/db/src/schema/`，迁移位于 `packages/db/src/migrations/`，迁移顺序以 `_journal.json` 为准。schema 是模型来源，迁移是数据库结构变更的可审查记录。
- 已有数据模型可支持：用户/会话/认证；考试、科目、阅读材料、题目及 JSONB 题型数据；练习套题与题目关联；考试尝试、分科结果和答案；题目/套题评分与反馈；AI 生成任务及输入、输出、日志；用户积分及积分流水；平台配置、管理员审计日志、邮件退信记录。
- 现有外键级联、唯一约束和索引可支持用户数据归属、题目/套题查找、作答历史、反馈管理和后台审计。新增查询优先复用现有关系与索引；新增索引须对应实际查询条件/排序，避免仅凭猜测堆叠索引。
- 需要结构变更时先更新 Drizzle schema，再用 `bun run db:generate` 生成迁移并审阅 SQL；在隔离的本地数据库验证后再由用户部署。`db:push`、`db:migrate`、`db:seed` 会影响数据库状态，仅可对明确的本地开发库执行；不可擅自连接、迁移、推送结构或填充真实数据。
- 分析题目质量、练习完成率、分数变化、用户留存和 AI 生成用量时，应优先从现有尝试/答案/反馈/生成任务记录构建查询或聚合；先明确数据口径和隐私范围，再决定是否增加字段或表。
- `user_credit` 与 `credit_transaction` 是积分模型，不等于订阅、支付或付费权益。未来收费须使用单独、可审计且可幂等处理的 billing/entitlement 模型，见“未来收费功能的边界”。
- 最近一次仓库检查中，本机 `127.0.0.1:5432` 未开放且没有真实数据库配置；因此只能依据 schema 和迁移审查模型，不能声称已检查数据库内的实时数据。每次任务应重新确认运行状态。

---
# AGENTS.md — Labas Project Guide

> This file is for AI agents. Read this first before making any changes.

---

## 1. Project Identity

- **Name:** `labas` — AI-powered multi-language test practice platform.
- **Repo type:** Turborepo monorepo (Bun workspaces).
- **Workspace packages:** `apps/*`, `packages/*`.
- **Runtime & package manager:** **Bun** (`packageManager: "bun@1.3.14"`).
  - Do **NOT** use `pnpm`, `npm`, or `yarn` unless explicitly required by a global tool.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19 + Vite + TanStack Router | File-based routing. **Not Next.js.** |
| Backend | Hono + tRPC | Entry: `apps/server/src/index.ts`. Port 3000. |
| DB Engine | PostgreSQL | Managed via Drizzle. |
| DB ORM | Drizzle ORM | **Not Prisma.** |
| Auth | Better-Auth | Email/password. |
| UI | shadcn/ui (shared) | Lives in `packages/ui`. Imported as `@labas/ui/components/*`. |
| AI | OpenAI-compatible API | User-managed API keys via Settings UI. |
| Build | Turborepo + `tsdown` | Server compiled with `tsdown`. |

---

## 3. Architecture Overview

```
labas/
├── apps/
│   ├── web/          # Frontend (Vite, TanStack Router) — Port 3001 (see vite.config.ts)
│   └── server/       # Backend (Hono, tRPC) — Port 3000
├── packages/
│   ├── ui/           # Shared shadcn/ui components & styles
│   ├── api/          # tRPC routers & business logic
│   ├── auth/         # Better-Auth configuration
│   ├── db/           # Drizzle schema, queries, migrations
│   ├── ai/           # AI generation: prompts, schemas, agentic pipeline
│   ├── env/          # Shared environment validation
│   └── config/       # Shared TypeScript configs
```

- **Internal imports** use the `@labas/*` workspace namespace.
- Do **NOT** create cross-imports between `apps/*` directly; route through `packages/*`.

---

## 4. Essential Commands

Use these exact commands. Do not substitute with `pnpm`/`npm`/`npx` equivalents.

```bash
# Install dependencies
bun install

# Development
bun run dev              # Start all apps (web + server)
bun run dev:web          # Start web app only
bun run dev:server       # Start server only

# Type checking
bun run check-types      # Check all packages

# Database (Drizzle)
bun run db:push          # Push schema changes to PostgreSQL
bun run db:studio        # Open Drizzle Studio UI
bun run db:migrate       # Run migrations
bun run db:generate      # Generate migration files
bun run db:seed          # Seed reference data (exam types, etc.)
bun run db:start         # Start local DB (if configured)
bun run db:stop          # Stop local DB

# Testing
bun test                 # Run all tests
bun run turbo test       # Run via turbo pipeline

# Build
bun run build            # Build all packages
```

---

## 5. Common Pitfalls — DO NOT

- ❌ **Do not use `pnpm` / `npm` / `yarn`** for package management or running scripts.
- ❌ **Do not assume Docker or Docker Compose** exists in this repo. Docker Compose is available in `packages/db/` for local development only.
- ❌ **Do not assume Next.js**. This project uses **Vite + TanStack Router**, not Next.js App Router or Pages Router.
- ❌ **Do not assume Prisma**. Database layer is **Drizzle ORM**.
- ❌ **Do not hardcode API keys** in source code. AI keys are user-managed via the Settings UI.
- ❌ **Do not add global CSS** in `apps/web` without checking `packages/ui/src/styles/globals.css` for existing design tokens and CSS variables.
- ❌ **Do not skip heading levels**. After `<h1>`, the next heading must be `<h2>`, not `<h3>` (or lower). Never have two `<h1>` on one page.
- ❌ **Do not create custom modal/dialog components**. Use shadcn `<Dialog>` from `@labas/ui/components/dialog` — it provides built-in focus trap, escape key, scroll lock, and ARIA.
- ❌ **Do not use `any`** in frontend TypeScript. Enforced by eslint `@typescript-eslint/no-explicit-any: "error"` in `apps/web/eslint.config.mjs`.

---

## 6. UI / Styling Guidelines

- Design tokens and global styles live in **`packages/ui/src/styles/globals.css`**.
- shadcn/ui primitives are shared via **`packages/ui`**.
- Import components like this:
  ```tsx
  import { Button } from "@labas/ui/components/button";
  ```
- To add new shadcn primitives, run from the **project root**:
  ```bash
  npx shadcn@latest add accordion dialog -c packages/ui
  ```
- App-specific blocks (non-shared) should be added directly in `apps/web/src/components/`.
- DevTools (TanStack Router, React Query) are **production-gated** via `import.meta.env.DEV` — do not remove the condition.
- App-level error boundary is in `__root.tsx` using `<ErrorFallback>` — route-level error boundaries via `errorComponent` route option.
- Lazy-loaded route components use the `.lazy.tsx` pattern: route file is thin, heavy component lives in `components/routes/*Page.tsx` wrapped in `Suspense`.

### Sticky Detail Page Header Pattern

Detail pages with long scrollable content (e.g. `package.$id.index.tsx`, `attempt.$id.tsx`) use a **sticky top header** pattern:

```tsx
<div className="min-h-screen pb-32 bg-[var(--warm-cream)]">
  {/* Sticky header */}
  <div className="sticky top-0 z-20 bg-[var(--warm-cream)]/95 backdrop-blur-sm border-b border-[var(--oat-border)] shadow-sm">
    <div className="px-6 md:px-12 lg:px-16 max-w-4xl mx-auto pt-4 pb-4">
      {/* Compact breadcrumb — text-xs, truncated title */}
      {/* Title row (left) + action buttons (right) */}
      {/* Stats row — text-xs */}
    </div>
  </div>
  {/* Scrollable content */}
  <div className="px-6 md:px-12 lg:px-16 max-w-4xl mx-auto pt-8">
    ...
  </div>
</div>
```

Rules:
- Primary CTA ("Mulai Latihan", "Coba Lagi") and secondary actions (Edit, Share) live in the sticky header — **never only at the bottom** of a long page.
- Breadcrumb inside the header is `text-xs` and truncates the current page title to `max-w-[240px]`.
- On small screens (`sm:` breakpoint), button text labels hide (`hidden sm:inline`) leaving only icons.

### Public/Private Toggle Hover Pattern

Any button that toggles visibility between public and private must reveal **intent on hover** (what will happen, not what it currently is):

```tsx
<button
  onClick={onTogglePublic}
  aria-label={isPublic ? "Jadikan privat" : "Jadikan publik"}
  className={`group ... ${isPublic
    ? "bg-[var(--matcha-300)] text-[var(--matcha-800)] hover:bg-[var(--pomegranate-400)]/15 hover:text-[var(--pomegranate-600)]"
    : "bg-[var(--slushie-500)]/15 text-[var(--slushie-800)] hover:bg-[var(--matcha-300)] hover:text-[var(--matcha-800)]"
  }`}
>
  <MaterialIcon name={isPublic ? "public" : "lock"} className="text-xs group-hover:hidden" />
  <MaterialIcon name={isPublic ? "lock" : "public"} className="text-xs hidden group-hover:inline" />
  <span className="group-hover:hidden">{isPublic ? "Publik" : "Privat"}</span>
  <span className="hidden group-hover:inline">{isPublic ? "Jadikan Privat" : "Jadikan Publik"}</span>
</button>
```

This pattern is used in `QuestionCard.tsx` and `PackageCard.tsx`.

### Component Folder Conventions

Large "card" components for list items are extracted into their own folder and file, **not** inlined inside the page component:

| Domain | Card component | Used in |
|--------|---------------|---------|
| Questions | `apps/web/src/components/bank/QuestionCard.tsx` | `BankPage.tsx` |
| Packages | `apps/web/src/components/packages/PackageCard.tsx` | `PackagesPage.tsx` |

When a list item card grows beyond ~40 lines of JSX, extract it. Pass all state through props; the card must be stateless (no data fetching).

### CalloutCard

`apps/web/src/components/bank/CalloutCard.tsx` is a reusable banner for "N items are private, publish them all" prompts. Use the `label` prop to customise the noun:

```tsx
<CalloutCard count={privateCount} label="soal" onPublishAll={handlePublishAllPrivate} />
<CalloutCard count={privateCount} label="paket" onPublishAll={handlePublishAllPrivate} />
```

`count` should come from a **dedicated query with `limit: 1`** (fetches only the `total` field), **not** from the locally accumulated infinite-scroll array — those counts are partial and misleading.

---

## 5b. Route Shell & Layout Modes

### Route Shell System

Every route declares its layout via `staticData` from `apps/web/src/lib/route-shell.ts`. The root layout (`__root.tsx`) reads this to decide which shell to render:

| Shell | When to use | What renders |
|-------|-------------|-------------|
| `routeShell.app` | Authenticated app pages | Sidebar + `<main id="main-content">` + SkipLink |
| `routeShell.public` | Landing, login, auth flows, 404 | Bare `min-h-screen` wrapper, no sidebar |
| `routeShell.fullscreen` | Test-taking, immersive UIs | `h-screen overflow-y-auto`, no sidebar |

Usage in a route file:
```tsx
import { routeShell } from "@/lib/route-shell";

export const Route = createFileRoute("/my-route")({
  staticData: routeShell.app, // or .public / .fullscreen
  ...
});
```

**Rules:**
- **Always** set `staticData` on every route. Routes without it default to `"app"` shell (sidebar shown).
- Auth routes (`/login`, `/forgot-password`, `/verify-email`, `/setup-avatar`) use `routeShell.public`.
- Test routes (`/package/$id/take`, `/package/$id/attempt/$attemptId`) use `routeShell.fullscreen`.
- Admin routes (`/admin`, `/admin/*`) use `routeShell.fullscreen`.

### Route Structure Conventions

- **`/`** — Public landing page (`index.tsx` + `index.lazy.tsx`). Redirects logged-in users to `/dashboard`.
- **`/dashboard`** — Authenticated home page (`dashboard.tsx`). Redirects unauthenticated users to `/login`.
- **`/landing`** — Legacy redirect → `/` (keep for backward compat, do not remove).
- **`/$.tsx`** — Catch-all 404 route. Uses `routeShell.public` so no sidebar appears. Renders `<NotFoundPage>`.
- **Do NOT** put a `notFoundComponent` in `__root.tsx`. The 404 is handled exclusively by the splat route `$.tsx`.

---

## 5c. Frontend Accessibility Conventions

- **Skip link**: Root layout in `__root.tsx` has a hidden `<SkipLink>` that appears on Tab press, linking to `#main-content` on the `<main>` element.
- **Icon-only buttons**: Every `<button>` or `<Button>` with only an icon (no visible text) **must** have `aria-label`. The icon element (`<MaterialIcon>`, `<span>`) should NOT have `aria-hidden="true"` unless decorative.
- **Heading hierarchy**: Never skip levels (`h1 → h2 → h3`, never `h1 → h3`). Exactly one `<h1>` per page. Heading level corresponds to semantic nesting, not visual size.
- **Form labels**: Every `<Input>`, `<select>`, `<textarea>` needs an associated `<Label>` (with `htmlFor` + `id`) OR an `aria-label` attribute. Search inputs, OTP digits, and icon-only filter buttons are common offenders.
- **Dialogs**: All modals use the shadcn `<Dialog>` component (from `@labas/ui/components/dialog`), which provides:
  - Focus trap inside dialog
  - Escape key to close
  - Scroll lock on body
  - Focus restoration to trigger element on close
  - ARIA `role="dialog"`, `aria-modal`, `aria-labelledby`
- **Custom tabs/accordions**: Must have proper ARIA roles (`role="tablist"`, `role="tab"`, `aria-selected`, `tabindex` for roving tabindex) and arrow key handlers. Prefer shadcn `<Tabs>` where possible; use manual ARIA + `handleRovingKeyDown` helper only when tabs have close buttons or other non-standard elements.

---

## 7. Environment & Secrets

- Server environment variables are loaded from **`apps/server/.env`**.
- See `apps/server/.env.example` for the full server env list and `apps/web/.env.example` for web env.
- Key variables include:
  - `DATABASE_URL` (PostgreSQL connection string)
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `CLOUDFLARE_TURNSTILE_SECRET_KEY` / `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY` (optional, bot protection)
- AI provider API keys are **NOT** stored in `.env`. Users configure their own keys via the Settings page in the UI.

---

## 8. Database Schema Conventions

- Schema files live in **`packages/db/src/schema/`**.
- Use `pgTable` from Drizzle. Primary keys are usually `uuid` with `.defaultRandom()`.
- Add indexes for frequently queried foreign keys.
- When adding tables or columns, generate and review a versioned migration with `bun run db:generate`; apply it only to an explicitly identified development database. Follow the Chinese database safety rules above; never push a schema directly to production.

---

## 9. AI Generation Context

- AI logic is centralized in **`packages/ai/`**.
- Key files:
  - `src/schemas.ts` — Zod schemas for questions, generation input, and output.
  - `src/prompts.ts` — Prompt builders for quick mode.
  - `src/agentic.ts` — Multi-step agentic generation pipeline (passage → validate → questions → self-check).
- Adding a new question format requires updates to:
  1. `packages/ai/src/schemas.ts` (enum + discriminated union)
  2. `packages/ai/src/prompts.ts` (format description)
  3. `packages/ai/src/agentic.ts` (format schema string)
  4. `packages/api/src/routers/attempt.ts` (answer normalization)
  5. `apps/web/src/lib/generate-constants.ts` (format metadata + allowed exams)
  6. `apps/web/src/lib/exam-constants.ts` (format string list)

---

## 10. Backend Conventions (tRPC / Hono)

### Error Handling
- **Always use English** error messages in tRPC routers.
- Use helper functions from `packages/api/src/lib/errors.ts`:
  ```ts
  import { throwNotFound, throwForbidden, throwBadRequest } from "@labas/api/lib/errors";
  assertOwnership(row, userId, "Question"); // throws NotFound or Forbidden
  ```
- Never throw raw `new Error("...")` in tRPC routers.

### Pagination
- Use shared schema + helper for all list endpoints:
  ```ts
  import { paginationSchema, paginateDefaults } from "@labas/api/lib/pagination";
  .input(z.object({ search: z.string().optional(), ...paginationSchema?.shape }).optional())
  const { limit, offset } = paginateDefaults(input);
  ```
- Return shape: `{ items: rows, total }` (or domain-specific name like `{ questions: rows, total }` for legacy compatibility).

### Authorization (Ownership)
- Use `assertOwnership(row, userId, resourceName)` from `packages/api/src/lib/ownership.ts`.
- Prefer explicit ownership query + assert over embedding `creatorUserId` in `.where()` for mutations that need a clear 404 vs 403.

### Visibility (Public/Private)
- Use `buildVisibilityCondition(table, userId)` from `packages/api/src/lib/visibility.ts` for list queries.
- Default behavior: guests see only public; authenticated users see public + their own private.

### Logging
- Winston logger is available in tRPC context via `ctx.logger`.
- Use `logger.info()`, `logger.error()`, etc. for business events and errors.
- Hono HTTP request logging is handled automatically by `hono/logger` in `apps/server/src/index.ts`.

### Router Structure
- Shared helpers live in `packages/api/src/lib/`.
- Routers live in `packages/api/src/routers/`.
- Register new routers in `packages/api/src/routers/index.ts`.

## 11. Admin Routes & DataTable

### Admin Route Structure
- Admin routes are flat files: `routes/admin.users.tsx`, `routes/admin.credits.tsx`, etc.
- Wrapped by `routes/admin.tsx` layout shell (sidebar + admin role check).
- All admin tRPC procedures live in `packages/api/src/routers/admin.ts` and use `adminProcedure` (extends `protectedProcedure` with role check).
- Mutations use `audit()` helper for audit logging to `adminAuditLog` table.

### DataTable Component (Design Reference)
- Admin table routes should eventually use a `<DataTable<T>>` component from `components/admin/DataTable.tsx`.
- API design: generic `<T>`, column defs with `accessorKey`/`accessorFn`/`cell` render prop, `actions` render prop, opt-in pagination, server-side sorting.
- Search bars, filter pills, and status pill buttons live **above** the DataTable in the route component (not inside it).
- **Do NOT** use DataTable for card-based layouts (e.g., Featured editor's pick) — keep card layouts as-is.

### Current Migration Status
- `admin.users.tsx` — table-based, good candidate for DataTable
- `admin.jobs.tsx` — table-based, good candidate
- `admin.moderation.tsx` — table-based, good candidate
- `admin.credits.tsx` — transaction table, good candidate
- `admin.featured.tsx` — card layout, keep as-is
- `admin.index.tsx` — dashboard stats cards, keep as-is

---

## 11b. Git & Workflow

- For this project, the user explicitly requires a local Git commit for each completed, focused change; follow the Chinese "Git 回溯要求" above. Do **NOT** push, rebase, or force-push unless the user explicitly asks for it.
- Do **NOT** create `README.md` or documentation files unless explicitly requested.
- Keep changes minimal and focused on the task at hand.
- Follow existing code style in the file you are editing.

---

## 12. Testing

### Test Runner
- **Bun test** (`bun test`) — built-in, Jest/Vitest compatible API (`describe`, `it`, `expect`).
- Turbo task `test` sudah dikonfigurasi.

### Test Location
- Unit tests: `src/__tests__/*.test.ts` di masing-masing package.
- Integration tests: `packages/api/src/__tests__/*.integration.test.ts` (pakai PGlite in-memory DB).

### Integration DB (PGlite)
- **PGlite** (`@electric-sql/pglite`) — PostgreSQL WASM in-memory.
- Strategy: `mock.module("@labas/db")` intercept DB saat dynamic import untuk inject PGlite-based drizzle instance.
- Setup helper: `packages/api/src/__tests__/test-setup.ts` — skema 14 tabel via raw SQL + seed data.
- Schema diimport dari `../../../db/src/schema` (langsung, bukan via `@labas/db`) untuk hindari env validation side-effect.
- Env vars di-mock via `mock.module("@labas/env/server")` sebelum dynamic import.

### tRPC Router Testing
- Gunakan `router.createCaller({ session, auth })` untuk memanggil procedure.
- Protected procedure: `session: { user: { id }, expiresAt: new Date() }`.
- Public procedure: `session: null`.

### Known Limitations
- **Rate limiter** (`checkRateLimit` di `attempt.ts`) pakai in-memory `Map`. Gunakan user ID berbeda per test atau `Bun.sleep()` untuk menghindari rate limit blocker.
- **Timer validation** (`finish`) butuh ≥5 detik elapsed sejak `start` — pakai `Bun.sleep()` + `{ timeout: 30000 }` pada `it()`.
- **Env vars Wajib** untuk di-mock saat integration test: `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL`, `CORS_ORIGIN`, `API_KEY_ENCRYPTION_KEY` (≥32 chars), `REDIS_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CLOUDFLARE_TURNSTILE_SECRET_KEY`.

### TDD Convention
- TDD: tulis test dulu, lihat fail, baru implementasi.
- Untuk existing code yang belum ada test: tulis test yang verifikasi behavior saat ini.
- Fungsi internal yang perlu di-test secara unit harus di-`export`.

---

_Last updated: 2026-05-25_
