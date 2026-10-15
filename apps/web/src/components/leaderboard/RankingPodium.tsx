import { LocalizedText } from "@/components/ui/LocalizedText";
import { motion } from "motion/react";
import { Card, CardContent } from "@labas/ui/components/card";
import { Avatar } from "@/components/ui/Avatar";

interface PodiumUser {
  rank: number;
  name: string;
  image: string | null;
  totalScore: number;
}

function PodiumCard({
  user,
  index,
  medalColor,
  medalIcon,
  height,
  avatarSize,
}: {
  user: PodiumUser;
  index: number;
  medalColor: string;
  medalIcon: string;
  height: string;
  avatarSize: "md" | "lg" | "xl";
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Avatar src={user.image} name={user.name} size={avatarSize} variant="leaderboard" bordered />
      <div className="text-center">
        <p className="text-sm font-headline font-bold text-[var(--clay-black)] truncate max-w-[120px]">
          {user.name}
        </p>
        <p className="text-xs text-[var(--warm-charcoal)]">{user.totalScore} <LocalizedText source={"pts"} /></p>
      </div>
      <Card className={`relative w-full clay-shadow bg-[var(--pure-white)] border-2 rounded-[var(--radius-xl)] overflow-visible ${medalColor} ${height}`}>
        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
          {index === 0 && (
            <span className="material-symbols-outlined text-lg absolute -top-2.5 bg-[var(--pure-white)] rounded-full px-1 clay-shadow border border-[#F59E0B] text-[#F59E0B]">
              stars
            </span>
          )}
          <span className="material-symbols-outlined text-3xl">{medalIcon}</span>
          <span className="text-2xl font-headline font-extrabold text-[var(--clay-black)] mt-1">
            #{user.rank}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RankingPodium({ top3 }: { top3: PodiumUser[] }) {
  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {top3.length >= 2 ? (
        <div className="w-[120px]">
          <PodiumCard
            user={top3[1]!}
            index={1}
            medalColor="border-[#94A3B8]"
            medalIcon="workspace_premium"
            height="h-28"
            avatarSize="lg"
          />
        </div>
      ) : (
        <div className="w-[120px]" />
      )}

      <div className="w-[140px]">
        {top3.length >= 1 && (
          <PodiumCard
            user={top3[0]!}
            index={0}
            medalColor="border-[#F59E0B] ring-2 ring-[#F59E0B] ring-offset-2"
            medalIcon="trophy"
            height="h-40"
            avatarSize="xl"
          />
        )}
      </div>

      {top3.length >= 3 ? (
        <div className="w-[120px]">
          <PodiumCard
            user={top3[2]!}
            index={2}
            medalColor="border-[#CD7F32]"
            medalIcon="award_star"
            height="h-24"
            avatarSize="lg"
          />
        </div>
      ) : (
        <div className="w-[120px]" />
      )}
    </div>
  );
}
