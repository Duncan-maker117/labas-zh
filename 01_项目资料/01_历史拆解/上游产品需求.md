# PRD: Labas — AI-Powered Multi-Language Test Practice Platform

## Problem Statement

Pelajar Indonesia yang mempersiapkan ujian bahasa (IELTS, TOEFL, JLPT, HSK, Goethe) kesulitan menemukan soal latihan reading comprehension yang:
- **Bervariasi** dan mencakup format soal spesifik tiap ujian (synonym, grammar-in-context, cloze, matching headings, author's view, dll.)
- **Terjangkau** — platform existing biasanya berbayar dan tidak fleksibel
- **Relevan** dengan kelemahan personal — tidak ada analisis per-section yang memberi rekomendasi perbaikan
- **Terbuka** — tidak ada platform open-source "bring your own key" untuk generasi soal AI

## Solution

**Labas** adalah platform open-source yang menyediakan:
1. **AI Question Generator** — generate soal reading comprehension pakai OpenAI-compatible API (BYOK). Dua mode: quick (single prompt) dan agentic (multi-step validation)
2. **Question Bank** — kumpulan soal publik/privat yang bisa di-browse, di-rating, dan digunakan ulang
3. **Package Builder** — susun paket soal dari kombinasi soal existing + AI-generated, dengan visibility publik/privat
4. **Package Combiner** — gabung section dari berbagai paket tanpa perlu generate ulang
5. **Exam Interface** — antarmuka ujian side-by-side (teks + soal), timer, auto-grade
6. **Deep Analytics** — evaluasi per-section, identifikasi kelemahan, rekomendasi paket soal untuk perbaikan
7. **Listening Comprehension** — audio player dengan TTS generation (Kokoro), format listening_multiple_choice, satu kali putar per soal
8. **Anti-cheat Lite** — deteksi tab-switch, inactivity auto-submit, copy-paste dan right-click blocking selama ujian

Target pengguna: pelajar Indonesia yang mempersiapkan IELTS, TOEFL, JLPT, HSK, dan ujian bahasa Jerman.

## User Stories

### AI Generation
1. Sebagai pelajar, saya ingin generate soal reading comprehension dengan AI menggunakan API key saya sendiri, agar saya bisa latihan tanpa batasan platform
2. Sebagai pelajar, saya ingin memilih jenis ujian (IELTS/TOEFL/JLPT/HSK/German), section (Reading/Writing), dan tingkat kesulitan sebelum generate, agar soal sesuai kebutuhan saya
3. Sebagai pelajar, saya ingin memilih format soal (multiple choice, true/false, matching, fill-in-blank, synonym, dll.) yang akan digenerate, agar latihan saya spesifik
4. Sebagai pelajar, saya ingin memilih topik bacaan (Science, Business, Arts, dll.) untuk soal yang digenerate, agar konteks relevan dengan minat saya
5. Sebagai pelajar, saya ingin melihat preview hasil generate sebelum menyimpan, agar saya bisa mengedit atau mere-generate soal yang kurang baik
6. Sebagai power user, saya ingin menggunakan mode "agentic" yang melakukan validasi multi-step (passage → validate → questions → self-answer → score), agar kualitas soal lebih terjamin
7. Sebagai pelajar casual, saya ingin menggunakan mode "quick" yang cepat dan hemat token, agar saya bisa langsung latihan

### Question Bank
8. Sebagai pelajar, saya ingin browse kumpulan soal publik berdasarkan bahasa, tingkat kesulitan, format, dan topik, agar saya bisa menemukan soal yang sesuai
9. Sebagai pelajar, saya ingin melihat detail soal (passage, pertanyaan, pilihan, jawaban) sebelum memutuskan menggunakannya
10. Sebagai pelajar, saya ingin memberi rating dan melihat rating soal/paket dari pengguna lain, agar saya tahu kualitasnya
11. Sebagai kreator, saya ingin mempublikasikan soal yang saya buat ke bank publik, agar orang lain bisa menggunakannya
12. Sebagai kreator, saya ingin menyimpan soal sebagai privat, agar hanya saya yang bisa mengaksesnya
13. Sebagai pelajar, saya ingin mencari soal berdasarkan keyword di teks bacaan atau pertanyaan

### Package Builder & Combiner
14. Sebagai pelajar, saya ingin membuat paket soal (bundle) dari beberapa soal yang saya pilih dari bank, agar saya bisa latihan dalam satu sesi terstruktur
15. Sebagai kreator, saya ingin memberi judul, deskripsi, dan visibility (publik/privat) pada paket yang saya buat
16. Sebagai pelajar, saya ingin mengkombinasikan section dari berbagai paket (misal: Reading dari Paket A, Writing dari Paket B) menjadi satu paket ujian baru, tanpa perlu generate ulang dengan AI
17. Sebagai pelajar, saya ingin melihat estimasi durasi dan jumlah soal sebelum memulai ujian

### Exam Interface
18. Sebagai pelajar, saya ingin melihat teks bacaan dan soal secara side-by-side saat mengerjakan, agar saya tidak perlu scroll bolak-balik
19. Sebagai pelajar, saya ingin timer yang menunjukkan sisa waktu pengerjaan, agar saya bisa mengatur pace
20. Sebagai pelajar, saya ingin navigasi antar soal (previous/next/jump), agar saya bisa mengerjakan dengan fleksibel
21. Sebagai pelajar, saya ingin menandai soal untuk direview nanti, agar saya bisa fokus dulu ke soal lain
22. Sebagai pelajar, saya ingin melihat progress (soal ke-X dari total) selama ujian
23. Sebagai pelajar, saya ingin jawaban saya tersimpan otomatis, agar tidak hilang jika koneksi terputus
24. Sebagai pelajar, saya ingin hasil ujian langsung terlihat setelah selesai (auto-grade untuk soal objektif)

### Analytics & Evaluation
25. Sebagai pelajar, saya ingin melihat skor per-section (Reading/Writing/Listening/Speaking) setelah ujian, agar saya tahu kekuatan dan kelemahan saya
26. Sebagai pelajar, saya ingin melihat breakdown akurasi per skill tag (grammar, vocabulary, inference, dll.), agar saya tahu area mana yang perlu diperbaiki
27. Sebagai pelajar, saya ingin melihat tren progres dari waktu ke waktu (line chart akurasi), agar saya tahu apakah saya improving
28. Sebagai pelajar, saya ingin melihat radar chart proficiency per skill, agar visualisasi kelemahan saya jelas
29. Sebagai pelajar, saya ingin mendapat rekomendasi paket soal yang fokus ke kelemahan saya, agar saya bisa memperbaiki area tersebut secara terarah
30. Sebagai pelajar, saya ingin melihat statistik: total soal dikerjakan, total waktu latihan, akurasi rata-rata

### Settings & Profile
31. Sebagai pengguna, saya ingin menyimpan API key saya (OpenAI-compatible) dengan aman (encrypted), agar saya tidak perlu input ulang setiap generate
32. Sebagai pengguna, saya ingin mengatur base URL dan model name untuk AI provider, agar saya bisa pakai provider alternatif (OpenRouter, Groq, local LLM)
33. Sebagai pengguna, saya ingin mengelola (tambah/edit/hapus) multiple API keys untuk provider berbeda
34. Sebagai pengguna, saya ingin mengedit profil (nama, avatar) saya

### Community
35. Sebagai pelajar, saya ingin melihat paket soal "trending" atau "staff pick", agar saya bisa menemukan soal berkualitas tinggi
36. Sebagai kreator, saya ingin melihat berapa kali paket soal saya digunakan orang lain
37. Sebagai pelajar, saya ingin membagikan link paket soal ke teman

### Listening Comprehension
38. Sebagai pelajar, saya ingin mendengarkan audio soal listening dan menjawab pertanyaan, agar saya bisa latihan listening comprehension

### Authentication
39. Sebagai pengguna, saya ingin login dengan akun Google atau GitHub tanpa harus membuat akun baru dengan email/password

### Exam Integrity
40. Sebagai penguji, saya ingin sistem mendeteksi tab-switch dan inactivity selama ujian, agar integritas tes lebih terjaga
41. Sebagai pelajar, saya ingin mendapat peringatan jika saya berpindah tab atau terlalu lama tidak menjawab, agar saya tetap fokus selama ujian

## Exam Types Supported

| Exam | Language | Levels | Focus Areas |
|------|----------|--------|-------------|
| IELTS Academic | English | Band 1-9 | Academic reading, formal writing |
| TOEFL iBT | English | 0-120 | Academic English, university context |
| JLPT | Japanese | N5-N1 | Kanji reading, grammar particles, text comprehension |
| HSK | Chinese | HSK 1-6 | Character recognition, word choice, sentence structure |
| Goethe-Zertifikat | German | A1-C2 | Article/case, vocabulary in context, Lückentext |
| TOPIK | Korean | TOPIK I-II | Particles, honorifics, speech levels |
| TOAFL | Arabic | — | RTL text support |
| DELE | Spanish | A1-C2 | Verb conjugation focus |

## Question Formats

| Format | IELTS | TOEFL | JLPT | HSK | German | Auto-Gradeable |
|--------|-------|-------|------|-----|--------|:---:|
| Multiple Choice | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| True/False/Not Given | ✓ | ✓ | | | ✓ | ✓ |
| Matching Headings | ✓ | ✓ | | | ✓ | ✓ |
| Matching Information | ✓ | ✓ | | | ✓ | ✓ |
| Fill in Blank | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Synonym / Vocabulary | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Grammar in Context | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sentence Completion | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Summary Completion | ✓ | ✓ | | | | ✓ |
| Cloze Test | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reference (pronoun) | | ✓ | ✓ | | | ✓ |
| Author's View | ✓ | ✓ | ✓ | | | ✓ |
| Kanji Reading | | | ✓ | | | ✓ |
| Particle Choice | | | ✓ | | | ✓ |
| Article / Case Choice | | | | | ✓ | ✓ |
| Listening Multiple Choice | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Implementation Decisions

### Tech Stack
- **Frontend**: React 19 + TanStack Router (SPA) + TanStack Query + Tailwind CSS 4 + shadcn/ui
- **Backend**: Hono + tRPC
- **Auth**: Better Auth (email/password)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI-compatible API (generic interface, user-provided keys)
- **Monorepo**: Turborepo + Bun workspaces
- **Theme**: Light default, dark toggle (system preference aware via next-themes)

### Architecture

```
apps/web/            React SPA frontend
  routes/            File-based routes (TanStack Router)
    index.tsx        Entry → redirects to dashboard or landing
    dashboard.tsx    Authenticated home
    landing.tsx      Legacy redirect → /
    login.tsx        Login
    forgot-password.tsx  Password reset
    verify-email.tsx Email verification
    setup-avatar.tsx Avatar setup
    $.tsx            Catch-all 404
    bank.tsx         Question Bank browse
    packages.tsx     Package listing
    package.$id.tsx  Package detail
    package.$id.take.tsx         Exam interface
    package.$id.attempt.$attemptId.tsx  Attempt review
    generate.tsx     AI Generator wizard
    analytics.tsx    Analytics dashboard
    leaderboard.tsx  Leaderboard
    history.tsx      Attempt history
    settings.tsx     Settings (API keys, profile)
    me.tsx           My profile
    profile.$userId.tsx  User public profile
    admin.tsx        Admin layout
    admin.index.tsx  Dashboard stats
    admin.users.tsx  User management
    admin.credits.tsx Credit management
    admin.jobs.tsx   Job management
    admin.moderation.tsx Question moderation
    admin.featured.tsx Featured content
    jobs.tsx         My generation jobs

apps/server/         Hono backend
  Mounts Better Auth + tRPC

packages/
  ai/                AI generation pipeline
  api/               tRPC routers + context
    routers/
      ai.ts          generateQuestions (streaming)
      question.ts    CRUD questions, search, filter
      package.ts     CRUD packages, sections
      combo.ts       Combo package creation
      attempt.ts     Attempts, grading, results
      stats.ts       Stats, trends, recommendations
      leaderboard.ts Leaderboard
      verification.ts Email verification & password reset
      settings.ts    API key management
      profile.ts     Profile management
      rating.ts      Question/package ratings
      feedback.ts    Question feedback
      admin.ts       Admin procedures
  auth/              Better Auth config
  db/                Drizzle ORM schema (22 tables)
  ui/                shadcn/ui shared components
  env/               Environment validation
```

### Deep Modules (testable in isolation)

- **`packages/ai/`** — AI generation pipeline
  - Interface: `generateQuestions(input: GenerationInput) => GenerationResult`
  - Two pipelines: `quick` (single call) and `agentic` (multi-step)
  - Zod schemas for all question formats (type-safe generation + validation)
  - OpenAI-compatible client abstraction

- **`packages/api/src/routers/`** — tRPC routers
  - Each router encapsulates one domain with clear procedures

### Database Schema (22 tables in `packages/db/src/schema/`)

```
exam_type          id, name, language, description
section_type       id, name
question           id, exam_type_id, section_type_id, format, passage_text,
                   question_text, options_json, correct_answer, explanation,
                   difficulty (1-5), skill_tags[], is_case_sensitive,
                   source (ai|manual), ai_model, creator_user_id,
                   is_public, is_featured, usage_count, avg_rating
testPackage        id, title, description, exam_type_id, creator_user_id,
                   is_public, total_questions, usage_count, avg_rating
packageSection     id, package_id, section_type_id, title, order_index
sectionQuestion    id, section_id, question_id, order_index
comboPackage       id, title, description, creator_user_id, is_public
comboSection       id, combo_id, source_package_id, source_section_id, order_index
testAttempt        id, user_id, package_id_or_combo_id, started_at, finished_at, total_score, is_abandoned
sectionResult      id, attempt_id, section_type, score, max_score, time_spent_sec
answer             id, section_result_id, question_id, user_answer, is_correct, time_spent_sec
questionRating     id, user_id, question_id, score (1-5), created_at
packageRating      id, user_id, package_id, score (1-5), created_at
questionFeedback   id, user_id, question_id, feedback_text, created_at
userCredit         id, user_id, token_balance, total_earned, total_spent
creditTransaction  id, user_id, amount, reason, reference_id, created_at
generationJob      id, user_id, status, progress, exam_type_id, created_at
adminAuditLog      id, admin_user_id, action, target_user_id, details, created_at
platformConfig     id, key, value

— Auth tables (managed by Better Auth): user, session, account, verification
```

### Agentic AI Pipeline

```
Step 1: Passage Generator   → Authentic reading passage sesuai level ujian
Step 2: Passage Validator   → Validasi akurasi, difficulty, grammar, panjang
Step 3: Question Generator  → Generate N questions dalam format yang diminta
Step 4: Self-Answer & Validate → AI menjawab sendiri, flag ambigu, hitung confidence
Step 5: Quality Scorer      → Overall score, needsHumanReview flag
```

### Weakness Analysis Algorithm

1. Group answers by `section_type` dan `skill_tag`
2. Hitung akurasi per group
3. Identifikasi skill tags dengan akurasi di bawah threshold (default 70%)
4. Sort by `total_attempts * (1 - accuracy)` — prioritize yang sering salah
5. Cari paket soal publik dengan skill tags yang match kelemahan user
6. Return top-N rekomendasi paket

---

## Implementation Phases

### ✅ Phase 1 — Foundation (Schema + Core Infrastructure) — DONE
**Goal:** Database siap, user bisa manage API key, AI pipeline dasar berjalan

| # | Task | Package |
|---|------|---------|
| 1.1 | Add application tables to Drizzle schema | `packages/db/` |
| 1.2 | Generate & run migrations | `packages/db/` |
| 1.3 | Create `packages/ai/` — OpenAI-compatible client + Zod schemas for all question formats | `packages/ai/` |
| 1.4 | AI key management tRPC router (encrypt/decrypt) | `packages/api/` |
| 1.5 | Settings page → API key CRUD UI | `apps/web/` |
| 1.6 | Quick mode AI generation pipeline (single call) | `packages/ai/` |
| 1.7 | AI Generator router + basic UI page | `packages/api/` + `apps/web/` |

**User stories delivered:** 1, 2, 3, 4, 7, 31, 32, 33

### ✅ Phase 2 — Question Bank & Packages — DONE
**Goal:** Soal bisa disimpan, dipublikasikan, di-browse, dan dibundle

| # | Task | Package |
|---|------|---------|
| 2.1 | Question CRUD tRPC router (search, filter, publish/unpublish) | `packages/api/` |
| 2.2 | Package CRUD tRPC router (create, add sections, add questions) | `packages/api/` |
| 2.3 | Question Bank browse page (grid, search, filters) | `apps/web/` |
| 2.4 | Package detail page (preview soal, rating, stats) | `apps/web/` |
| 2.5 | AI Generator → save result as question / package | `apps/web/` |
| 2.6 | Test Builder page (craft package from bank items) | `apps/web/` |
| 2.7 | Rating system for public questions/packages | `packages/api/` |

**User stories delivered:** 5, 8, 9, 10, 11, 12, 13, 14, 15, 17

### ✅ Phase 3 — Package Combiner + Agentic Mode — DONE
**Goal:** Pengguna bisa mix section dari berbagai paket; power user bisa pakai agentic generation

| # | Task | Package |
|---|------|---------|
| 3.1 | Combo package tRPC router | `packages/api/` |
| 3.2 | Package Combiner UI (select sections from different packages) | `apps/web/` |
| 3.3 | Agentic mode AI pipeline (multi-step) | `packages/ai/` |
| 3.4 | Agentic mode toggle + streaming progress in AI Generator UI | `apps/web/` |

**User stories delivered:** 6, 16

### ✅ Phase 4 — Exam Experience — DONE
**Goal:** Pengguna bisa mengerjakan ujian dengan antarmuka side-by-side, timer, auto-grade

| # | Task | Package |
|---|------|---------|
| 4.1 | Exam attempt + answer submission tRPC router | `packages/api/` |
| 4.2 | Auto-grade logic (untuk semua format objektif) | `packages/api/` |
| 4.3 | Exam Interface page (side-by-side passage + questions) | `apps/web/` |
| 4.4 | Timer component (client-side with periodic sync) | `apps/web/` |
| 4.5 | Question navigation (prev/next/jump, mark for review) | `apps/web/` |
| 4.6 | Auto-save answers | `apps/web/` |
| 4.7 | Exam Results page (per-section scores, answer review) | `apps/web/` |

**User stories delivered:** 18, 19, 20, 21, 22, 23, 24, 25

### 🔶 Phase 5 — Analytics & Recommendations — PARTIAL
**Goal:** User bisa melihat performa, kelemahan, dan rekomendasi perbaikan

| # | Task | Package |
|---|------|---------|
| 5.1 | Analytics tRPC router (stats, trends, skill breakdown) | `packages/api/` |
| 5.2 | Weakness identification + recommendation algorithm | `packages/api/` |
| 5.3 | Deep Analytics dashboard page (stats cards, line chart, radar chart) | `apps/web/` |
| 5.4 | Performance by Skill table | `apps/web/` |
| 5.5 | Recommended packages section on dashboard | `apps/web/` |

**User stories delivered:** 26, 27, 28, 29, 30

### 🟡 Phase 6 — Community & Polish — IN PROGRESS
**Goal:** Platform terasa hidup dengan konten komunitas, trending, PWA offline support

| # | Task | Package |
|---|------|---------|
| 6.1 | Trending / most-used packages endpoint | `packages/api/` |
| 6.2 | Staff pick / featured content | `apps/web/` |
| 6.3 | Creator stats (usage count, rating) on profile | `apps/web/` |
| 6.4 | Share link for public packages | `apps/web/` |
| 6.5 | PWA offline support for exam mode (cache questions) | `apps/web/` |
| 6.6 | UI polish, loading skeletons, empty states, error boundaries | `apps/web/` |
| 6.7 | i18n foundation (Bahasa Indonesia UI strings) | `apps/web/` |
| 6.8 | Listening comprehension — merge TTS service, audio player, listening format | `all` |
| 6.9 | OAuth login (Google, GitHub) via Better Auth social providers | `packages/auth/` + `apps/web/` |
| 6.10 | Anti-cheat lite — tab-switch detection, inactivity timer, copy-paste blocking, user warning | `apps/web/` |

**User stories delivered:** 34, 35, 36, 37, 38, 39, 40, 41

---

## Out of Scope

- Mobile app (React Native) — web-first, PWA covers mobile
- Writing essay auto-grading — terlalu kompleks dan unreliable untuk AI saat ini
- Speaking section generation — fokus ke reading comprehension dulu
- Full proctoring (webcam, face tracking, browser lockdown) — anti-cheat lite (tab-switch, inactivity, copy-paste) sudah in-scope
- Subscription / payment system — open-source, self-hosted
- Real-time multiplayer
- Social features (comments, following) beyond ratings and community channels

## Testing Strategy

- **AI package** (`packages/ai/`): Unit tests for Zod validation schemas, integration tests with mocked LLM responses
- **API routers** (`packages/api/src/routers/`): tRPC procedure tests against test database
- **Package Combiner**: Complex business logic — priority for testing
- **Auto-grade logic**: Must be correct — parametrized tests per format
- **Test structure**: `packages/*/__tests__/` (establishing fresh — codebase has no tests yet)

A good test:
- Tests external behavior (API contract), not implementation details
- Uses tRPC test client to call procedures end-to-end
- Isolates AI calls via mocking

## Further Notes

- Repo akan dijadikan open-source — semua API key di-skip dari git, dokumentasi jelas untuk self-hosting
- UI text dalam Bahasa Indonesia (target pengguna), kode dalam English
- Soal bisa bilingual (passage dalam bahasa target, instruksi dalam Bahasa Indonesia)
- Timer di exam interface harus client-side dengan periodic sync ke server
- PWA support sudah ada, perlu di-enhance untuk offline exam mode (cache soal)
- Default theme: light, dark toggle tetap ada
- Nama "Labas" dari "labs" + "bahasa"
