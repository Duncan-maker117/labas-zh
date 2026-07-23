import { Tabs, TabsList, TabsTrigger, TabsContent } from "@labas/ui/components/tabs";
import { ScoreTrendChart } from "./ScoreTrendChart";
import { BreakdownCharts, type ExamTypeItem, type SectionTypeItem, type FormatItem } from "./BreakdownCharts";
import { TimeAnalyticsPanel, type SectionTimeItem, type FormatTimeItem, type TimeTrendItem } from "./TimeAnalyticsPanel";

interface ChartsBundleProps {
  trend: { date: string; attempts: number; avgScorePct: number }[] | undefined;
  byExamType: ExamTypeItem[] | undefined;
  bySectionType: SectionTypeItem[] | undefined;
  byFormat: FormatItem[] | undefined;
  sectionTime: SectionTimeItem[] | undefined;
  formatTimeData: FormatTimeItem[] | undefined;
  timeTrend: TimeTrendItem[] | undefined;
}

export default function ChartsBundle({
  trend,
  byExamType,
  bySectionType,
  byFormat,
  sectionTime,
  formatTimeData,
  timeTrend,
}: ChartsBundleProps) {
  return (
    <Tabs defaultValue="trend" className="w-full">
      <TabsList className="h-12 bg-transparent w-full justify-start gap-2">
        <TabsTrigger
          value="trend"
          className="h-11 px-5 rounded-[var(--radius-lg)] text-sm font-semibold data-[active=true]:bg-[var(--clay-black)] data-[active=true]:text-[var(--pure-white)] data-[active=true]:clay-shadow bg-[var(--pure-white)] text-[var(--warm-charcoal)] border-2 border-[var(--oat-border)] hover:bg-[var(--oat-light)] transition-all"
        >
          Tren Skor
        </TabsTrigger>
        <TabsTrigger
          value="performa"
          className="h-11 px-5 rounded-[var(--radius-lg)] text-sm font-semibold data-[active=true]:bg-[var(--clay-black)] data-[active=true]:text-[var(--pure-white)] data-[active=true]:clay-shadow bg-[var(--pure-white)] text-[var(--warm-charcoal)] border-2 border-[var(--oat-border)] hover:bg-[var(--oat-light)] transition-all"
        >
          Performa
        </TabsTrigger>
        <TabsTrigger
          value="waktu"
          className="h-11 px-5 rounded-[var(--radius-lg)] text-sm font-semibold data-[active=true]:bg-[var(--clay-black)] data-[active=true]:text-[var(--pure-white)] data-[active=true]:clay-shadow bg-[var(--pure-white)] text-[var(--warm-charcoal)] border-2 border-[var(--oat-border)] hover:bg-[var(--oat-light)] transition-all"
        >
          Waktu
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trend" className="pt-6">
        <ScoreTrendChart data={trend} />
      </TabsContent>

      <TabsContent value="performa" className="pt-6">
        <BreakdownCharts
          byExamType={byExamType}
          bySectionType={bySectionType}
          byFormat={byFormat}
        />
      </TabsContent>

      <TabsContent value="waktu" className="pt-6">
        <TimeAnalyticsPanel
          sectionTime={sectionTime}
          formatTimeData={formatTimeData}
          timeTrend={timeTrend}
        />
      </TabsContent>
    </Tabs>
  );
}
