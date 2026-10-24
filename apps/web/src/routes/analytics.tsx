/* Hallmark · redesign: analytics · genre: modern-minimal · macrostructure: Stat-Led
 * design-system: 01_项目资料/01_历史拆解/上游设计说明.md · theme: Clay (warm-cream · oat · swatch palette)
 */
import { useLocale } from "@/lib/locale";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { Suspense, lazy, useEffect } from "react";
import { createFileRoute, redirect, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useAnalytics } from "@/hooks/use-analytics";
import { trackUmamiEvent, AnalyticsEvent } from "@/lib/umami";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { OverviewCards } from "@/components/analytics/OverviewCards";
import { WeaknessPanel } from "@/components/analytics/WeaknessPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@labas/ui/components/select";
import { EXAM_TYPES } from "@/lib/exam-constants";

const ChartsBundle = lazy(() => import("@/components/analytics/ChartsBundle"));

export const Route = createFileRoute("/analytics")({
  component: AnalyticsComponent,
  validateSearch: z.object({
    examTypeId: z.string().optional(),
  }).parse,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--matcha-600)]" />
      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--warm-charcoal)]">
        {label}
      </span>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-xl)]" />
      <div className="h-80 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-xl)]" />
    </div>
  );
}

function AnalyticsComponent() {
  const { ui } = useLocale();
  const navigate = useNavigate();
  const routeSearch = useSearch({ strict: false }) as Record<string, string>;
  const examTypeId = routeSearch.examTypeId ?? "";

  const {
    overview,
    byExamType,
    bySectionType,
    byFormat,
    trend,
    weaknesses,
    timeAnalytics,
    isLoading,
  } = useAnalytics(examTypeId || undefined);

  useEffect(() => {
    trackUmamiEvent(AnalyticsEvent.VIEW_ANALYTICS);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-8 pb-32 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto bg-[var(--warm-cream)]">
        <div className="h-8 w-64 bg-[var(--oat-light)] animate-pulse rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-xl)]" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-[var(--warm-cream)]">
      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        {/* Header */}
        <div className="pt-8 mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--warm-charcoal)] mb-4">
            <Link to="/dashboard" className="hover:text-[var(--clay-black)] transition-colors">
              <LocalizedText source={"Beranda"} />
            </Link>
            <MaterialIcon name="chevron_right" className="text-xs" />
            <span className="text-[var(--clay-black)] font-medium"><LocalizedText source={"Analitik"} /></span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-headline font-extrabold text-[var(--clay-black)] tracking-tight">
                <LocalizedText source={"Analitik"} />
              </h1>
              <p className="text-base text-[var(--warm-charcoal)] mt-1">
                <LocalizedText source={"Pantau perkembangan dan identifikasi area untuk ditingkatkan."} />
              </p>
            </div>
            <Select
              value={examTypeId}
              onValueChange={(v) => navigate({ search: { examTypeId: v || undefined } as any, replace: true })}
            >
              <SelectTrigger className="w-48 h-11 clay-shadow rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] cursor-pointer" aria-label={ui("Filter jenis ujian")}>
                <SelectValue placeholder={ui("Semua Ujian")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=""><LocalizedText source={"Semua Ujian"} /></SelectItem>
                {EXAM_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hero stat */}
        {overview.data && (
          <div className="mb-8 p-6 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--matcha-300)]/30 to-[var(--slushie-500)]/20 border-2 border-[var(--matcha-400)]">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center w-16 h-16 rounded-[var(--radius-2xl)] bg-[var(--clay-black)] shrink-0">
                <MaterialIcon name="speed" className="text-3xl text-[var(--pure-white)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-headline font-extrabold text-[var(--clay-black)] tracking-tight">
                    {overview.data.overallAccuracyPct}%
                  </span>
                  <span className="text-sm font-semibold text-[var(--warm-charcoal)] uppercase tracking-wide">
                    <LocalizedText source={"Akurasi"} />
                  </span>
                </div>
                <p className="text-sm text-[var(--warm-charcoal)] mt-1">
                  {overview.data.totalQuestionsAnswered} <LocalizedText source={"soal dijawab ·"} /> {overview.data.totalAttempts} <LocalizedText source={"latihan ·"} /> {overview.data.avgScorePct}<LocalizedText source={"% rata-rata skor"} />
                </p>
              </div>
            </div>
          </div>
        )}

        {!overview.data && (
          <div className="mb-8 p-8 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--oat-border)] bg-[var(--pure-white)] text-center">
            <MaterialIcon name="insights" className="text-5xl text-[var(--warm-silver)] mx-auto mb-3" />
            <p className="font-semibold text-[var(--clay-black)]"><LocalizedText source={"Belum ada data analitik"} /></p>
            <p className="text-sm text-[var(--warm-charcoal)] mt-1"><LocalizedText source={"Selesaikan latihan pertamamu untuk melihat statistik."} /></p>
            <Link
              to="/bank"
              className="inline-block mt-4 px-5 py-2.5 text-sm font-semibold rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] clay-hover transition-all"
            >
              <LocalizedText source={"Mulai Latihan"} />
            </Link>
          </div>
        )}

        {/* Ringkasan */}
        <SectionLabel label={ui("Ringkasan")} />
        <OverviewCards data={overview.data} />
      </div>

      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto pt-10">
        {/* Charts — lazy loaded with internal tabs */}
        <Suspense fallback={<ChartSkeleton />}>
          <ChartsBundle
            trend={trend.data}
            byExamType={byExamType.data}
            bySectionType={bySectionType.data}
            byFormat={byFormat.data}
            sectionTime={timeAnalytics.data?.sectionTime}
            formatTimeData={timeAnalytics.data?.formatTime}
            timeTrend={timeAnalytics.data?.timeTrend}
          />
        </Suspense>

        {/* Area Lemah */}
        <div className="mt-12">
          <SectionLabel label={ui("Area Lemah")} />
          <WeaknessPanel
            weaknesses={weaknesses.data?.weaknesses}
            recommendations={weaknesses.data?.recommendations}
          />
        </div>
      </div>
    </div>
  );
}
