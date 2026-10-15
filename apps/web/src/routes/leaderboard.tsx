/* Hallmark · redesign: leaderboard · genre: modern-minimal · macrostructure: Leaderboard
 * design-system: DESIGN.md · theme: Clay (warm-cream · oat · swatch palette)
 */
import { useLocale } from "@/lib/locale";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { Button } from "@labas/ui/components/button";
import { Card, CardContent } from "@labas/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@labas/ui/components/select";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { EXAM_TYPES } from "@/lib/exam-constants";
import { RankingPodium } from "@/components/leaderboard/RankingPodium";
import { RankingRow } from "@/components/leaderboard/RankingRow";
import { MyRankCard } from "@/components/leaderboard/MyRankCard";

interface RankedEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  totalScore: number;
  avgScorePct: number;
  attemptsCount: number;
}

const PERIODS = [
  { value: "today" as const, label: "Hari Ini" },
  { value: "week" as const, label: "Minggu Ini" },
  { value: "month" as const, label: "Bulan Ini" },
  { value: "all" as const, label: "Sepanjang Masa" },
] as const;

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  validateSearch: z.object({
    examTypeId: z.string().optional(),
  }).parse,
});

function addRank<T extends { userId: string }>(items: T[], offset = 0): (T & { rank: number })[] {
  return items.map((item, i) => ({ ...item, rank: offset + i + 1 }));
}

function GapRow({ count }: { count: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 py-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex-1 h-px bg-[var(--oat-border)]" />
      <span className="text-xs font-medium text-[var(--warm-silver)] whitespace-nowrap">
        {count.toLocaleString()} <LocalizedText source={"peserta lainnya"} />
      </span>
      <div className="flex-1 h-px bg-[var(--oat-border)]" />
    </motion.div>
  );
}

function LeaderboardPage() {
  const { ui } = useLocale();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;
  const navigate = useNavigate();
  const routeSearch = useSearch({ strict: false }) as Record<string, string>;

  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("week");
  const [examTypeId, setExamTypeId] = useState<string>(routeSearch.examTypeId ?? "");

  const handleExamTypeChange = (value: string) => {
    setExamTypeId(value);
    navigate({ search: { examTypeId: value || undefined } as any, replace: true });
  };

  const rankingsQuery = useQuery(
    trpc.leaderboard.getRankings.queryOptions({
      period,
      examTypeId: examTypeId || undefined,
      limit: 20,
      offset: 0,
      nearUserId: session?.user.id ?? undefined,
    }),
  );

  const myRankQuery = useQuery({
    ...trpc.leaderboard.getMyRank.queryOptions({
      period,
      examTypeId: examTypeId || undefined,
    }),
    enabled: isLoggedIn,
  });

  const rankingsData = rankingsQuery.data;
  const rawRankings = rankingsData && "rankings" in rankingsData
    ? (rankingsData as { rankings: RankedEntry[]; nearRankings: RankedEntry[]; total: number; userRank: number | null }) : null;
  const rankings = rawRankings ? addRank(rawRankings.rankings) : [];
  const nearRankings = rawRankings ? addRank(rawRankings.nearRankings, 5) : [];
  const total = rawRankings?.total ?? 0;
  const userRank = rawRankings?.userRank ?? null;
  const isLoading = rankingsQuery.isLoading;

  const gap = userRank ? Math.max(0, userRank - 3 - 5) : 0;

  const nextRankEntry = [...nearRankings].filter(r => r.rank < (userRank ?? 0)).sort((a, b) => b.rank - a.rank)[0];
  const pointsBehindNext = nextRankEntry && myRankQuery.data
    ? Math.max(1, nextRankEntry.totalScore - myRankQuery.data.totalScore)
    : null;

  return (
    <div className="min-h-screen pb-32 bg-[var(--warm-cream)]">
      <div className="px-6 md:px-12 lg:px-16 max-w-4xl mx-auto">
        {/* Header */}
        <div className="pt-8 mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--warm-charcoal)] mb-4">
            <Link to="/dashboard" className="hover:text-[var(--clay-black)] transition-colors">
              <LocalizedText source={"Beranda"} />
            </Link>
            <MaterialIcon name="chevron_right" className="text-xs" />
            <span className="text-[var(--clay-black)] font-medium"><LocalizedText source={"Klasemen"} /></span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-headline font-extrabold text-[var(--clay-black)] tracking-tight">
                <LocalizedText source={"Klasemen"} />
              </h1>
              <p className="text-base text-[var(--warm-charcoal)] mt-1">
                <LocalizedText source={"Lihat peringkat berdasarkan total skor latihan."} />
              </p>
            </div>
          </div>
        </div>

        {/* Period buttons */}
        <motion.div
          className="flex flex-wrap gap-2 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              onClick={() => setPeriod(p.value)}
              className={`rounded-[var(--radius-lg)] clay-hover cursor-pointer transition-all ${
                period === p.value
                  ? "bg-[var(--clay-black)] text-[var(--pure-white)]"
                  : "border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-[var(--clay-black)] hover:bg-[var(--oat-light)]"
              }`}
            >
              {ui(p.label)}
            </Button>
          ))}
        </motion.div>

        {/* Exam filter */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Select value={examTypeId} onValueChange={(v) => handleExamTypeChange(v ?? "")}>
            <SelectTrigger className="w-[180px] rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)]">
              <SelectValue placeholder={ui("Semua Ujian")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value=""><LocalizedText source={"Semua Ujian"} /></SelectItem>
                {EXAM_TYPES.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-end justify-center gap-4 py-8">
              {[120, 140, 120].map((w, i) => (
                <div
                  key={i}
                  className={`w-[${w}px] ${i === 1 ? "h-36" : i === 0 ? "h-28" : "h-24"} bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-xl)]`}
                />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-xl)]" />
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <Card className="bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
            <CardContent className="p-12 text-center">
              <MaterialIcon name="leaderboard" className="text-5xl text-[var(--warm-silver)] mx-auto mb-4" />
              <p className="text-[var(--warm-charcoal)] font-semibold text-lg">
                <LocalizedText source={"Belum ada data untuk periode ini"} />
              </p>
              <p className="text-sm text-[var(--warm-silver)] mt-2">
                <LocalizedText source={"Mulai latihan dan selesaikan paket soal untuk masuk klasemen."} />
              </p>
              <Link to="/packages" className="inline-block mt-6">
                <Button className="bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] rounded-[var(--radius-lg)] clay-shadow clay-hover cursor-pointer">
                  <MaterialIcon name="folder" className="mr-2" />
                  <LocalizedText source={"Mulai Latihan"} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium Top 3 */}
            <RankingPodium top3={rankings.slice(0, 3)} />

            {/* Rankings List — ranks 4+ */}
            <motion.div
              className="space-y-3 mt-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
                hidden: {},
              }}
            >
              {rankings.slice(3).map((entry: RankedEntry) => (
                <motion.div
                  key={entry.userId}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                  }}
                >
                  <RankingRow
                    entry={entry}
                    isCurrentUser={isLoggedIn && entry.userId === session?.user.id}
                  />
                </motion.div>
              ))}

              {/* Gap if user is beyond top 5 */}
              {gap > 0 && <GapRow count={gap} />}

              {/* Near user's rank */}
              {nearRankings.map((entry: RankedEntry) => (
                <motion.div
                  key={entry.userId}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                  }}
                >
                  <RankingRow
                    entry={entry}
                    isCurrentUser={isLoggedIn && entry.userId === session?.user.id}
                  />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        {/* My Rank Card */}
        {isLoggedIn && (
          <MyRankCard
            data={myRankQuery.data}
            isLoading={myRankQuery.isLoading}
            pointsBehindNext={pointsBehindNext}
            nextRankPosition={nextRankEntry?.rank ?? null}
          />
        )}
      </div>
    </div>
  );
}
