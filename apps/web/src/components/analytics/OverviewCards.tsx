import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Card, CardContent } from "@labas/ui/components/card";
import { formatTime } from "@/lib/time";

interface OverviewCardsProps {
  data: {
    totalAttempts: number;
    completedAttempts: number;
    abandonedAttempts: number;
    avgScorePct: number;
    totalTimeSpentSec: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    overallAccuracyPct: number;
  } | undefined;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--matcha-300)]/20 mb-3">
            <MaterialIcon name="school" className="text-[var(--matcha-600)]" />
          </div>
          <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
            {data.totalAttempts}
          </div>
          <div className="text-xs text-[var(--warm-charcoal)] mt-1">Total Latihan</div>
        </CardContent>
      </Card>

      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--matcha-300)]/20 mb-3">
            <MaterialIcon name="check_circle" className="text-[var(--matcha-600)]" />
          </div>
          <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
            {data.completedAttempts}
          </div>
          <div className="text-xs text-[var(--warm-charcoal)] mt-1">Selesai</div>
        </CardContent>
      </Card>

      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--lemon-300)]/20 mb-3">
            <MaterialIcon name="trending_up" className="text-[var(--lemon-700)]" />
          </div>
          <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
            {data.avgScorePct}%
          </div>
          <div className="text-xs text-[var(--warm-charcoal)] mt-1">Rata-rata Skor</div>
        </CardContent>
      </Card>

      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--ube-300)]/20 mb-3">
            <MaterialIcon name="target" className="text-[var(--ube-600)]" />
          </div>
          <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
            {data.overallAccuracyPct}%
          </div>
          <div className="text-xs text-[var(--warm-charcoal)] mt-1">Akurasi</div>
        </CardContent>
      </Card>

      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--slushie-600)]/15 mb-3">
            <MaterialIcon name="timer" className="text-[var(--slushie-600)]" />
          </div>
          <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
            {formatTime(data.totalTimeSpentSec)}
          </div>
          <div className="text-xs text-[var(--warm-charcoal)] mt-1">Waktu Total</div>
        </CardContent>
      </Card>

      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardContent className="p-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--pomegranate-400)]/15 mb-3">
            <MaterialIcon name="quiz" className="text-[var(--pomegranate-600)]" />
          </div>
          <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
            {data.totalQuestionsAnswered}
          </div>
          <div className="text-xs text-[var(--warm-charcoal)] mt-1">Soal Dijawab</div>
        </CardContent>
      </Card>
    </div>
  );
}
