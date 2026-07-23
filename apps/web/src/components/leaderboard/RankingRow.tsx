import { motion } from "motion/react";
import { Card, CardContent } from "@labas/ui/components/card";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@tanstack/react-router";

interface RankingEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  totalScore: number;
  avgScorePct: number;
  attemptsCount: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const icons = { 1: "trophy", 2: "workspace_premium", 3: "award_star" } as const;
    return (
      <span className="material-symbols-outlined text-2xl">
        {icons[rank as keyof typeof icons]}
      </span>
    );
  }

  const isHighlight = rank <= 10;
  return (
    <span
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-headline font-extrabold shrink-0 ${
        isHighlight
          ? "bg-[var(--slushie-500)]/15 text-[var(--slushie-800)]"
          : "bg-[var(--oat-light)] text-[var(--warm-charcoal)]"
      }`}
    >
      {rank}
    </span>
  );
}

export function RankingRow({
  entry,
  isCurrentUser,
}: {
  entry: RankingEntry;
  isCurrentUser: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.015 }}
    >
      <Link
        to="/profile/$userId"
        params={{ userId: entry.userId }}
        className="block"
      >
        <Card
          className={`clay-shadow bg-[var(--pure-white)] border-2 rounded-[var(--radius-xl)] clay-hover cursor-pointer transition-colors ${
            isCurrentUser
              ? "border-[var(--matcha-400)] bg-[var(--matcha-100)]"
              : "border-[var(--oat-border)] hover:border-[var(--slushie-500)]"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <RankBadge rank={entry.rank} />
              <Avatar src={entry.image} name={entry.name} size="md" variant="leaderboard" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-headline font-bold text-[var(--clay-black)] truncate">
                  {entry.name}
                </p>
                <p className="text-xs text-[var(--warm-charcoal)]">
                  {entry.avgScorePct}% avg &middot; {entry.attemptsCount} latihan
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-headline font-extrabold text-[var(--clay-black)]">
                  {entry.totalScore}
                </p>
                <p className="text-xs text-[var(--warm-charcoal)]">pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
