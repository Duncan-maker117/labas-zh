import { motion } from "motion/react";
import { Card, CardContent } from "@labas/ui/components/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Link } from "@tanstack/react-router";

interface MyRankData {
  rank: number | null;
  totalParticipants: number;
  totalScore: number;
  avgScorePct: number;
  attemptsCount: number;
}

interface MyRankCardProps {
  data: MyRankData | undefined;
  isLoading: boolean;
  pointsBehindNext: number | null;
  nextRankPosition: number | null;
}

export function MyRankCard({
  data,
  isLoading,
  pointsBehindNext,
  nextRankPosition,
}: MyRankCardProps) {
  if (isLoading) {
    return (
      <Card className="sticky bottom-20 mt-6 clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-[var(--oat-light)] animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-[var(--oat-light)] animate-pulse rounded" />
              <div className="h-3 w-24 bg-[var(--oat-light)] animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.rank === null) {
    return (
      <Card className="sticky bottom-20 mt-6 clay-shadow bg-[var(--pure-white)] border-2 border-[var(--matcha-400)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-[var(--matcha-300)] flex items-center justify-center shrink-0">
              <MaterialIcon name="person" className="text-xl text-[var(--matcha-800)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-headline font-bold text-[var(--clay-black)]">
                Posisimu
              </p>
              <p className="text-xs text-[var(--warm-charcoal)]">
                Belum ada data untuk periode ini.
              </p>
            </div>
            <Link
              to="/bank"
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] clay-hover transition-all"
            >
              Mulai Latihan
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card className="sticky bottom-20 mt-6 clay-shadow bg-[var(--matcha-100)] border-2 border-[var(--matcha-400)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--matcha-300)] flex items-center justify-center shrink-0 clay-shadow">
              <span className="text-lg font-headline font-extrabold text-[var(--matcha-800)]">
                #{data.rank}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-headline font-bold text-[var(--clay-black)]">
                Peringkat #{data.rank} dari {data.totalParticipants}
              </p>
              <p className="text-xs text-[var(--warm-charcoal)]">
                {data.avgScorePct}% avg &middot; {data.attemptsCount} latihan &middot; {data.totalScore} pts
              </p>
              {pointsBehindNext !== null && pointsBehindNext > 0 && (
                <p className="text-xs font-semibold text-[var(--pomegranate-600)] mt-1">
                  Butuh {pointsBehindNext} pts lagi untuk naik ke #{nextRankPosition}
                </p>
              )}
            </div>
            <Link
              to="/bank"
              className="shrink-0 px-4 py-2 text-xs font-semibold rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] clay-hover transition-all"
            >
              Kejar
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
