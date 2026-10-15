import { LocalizedText } from "@/components/ui/LocalizedText";
import { useLocale } from "@/lib/locale";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@labas/ui/components/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@labas/ui/components/tabs";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type Period = "daily" | "weekly" | "monthly";

interface ChartDataPoint {
  date: string;
  label: string;
  totalTokens: number;
  jobCount: number;
}

function formatTokenValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function TokenUsageChart() {
  const { locale, ui } = useLocale();
  const [period, setPeriod] = useState<Period>("daily");

  const { data, isLoading } = useQuery(
    trpc.ai.tokenUsageHistory.queryOptions({ period }),
  );

  const chartData: ChartDataPoint[] = (data ?? []).map((d) => ({
    date: d.date,
    label: d.label,
    totalTokens: d.totalTokens,
    jobCount: d.jobCount,
  }));

  const hasData = chartData.some((d) => d.totalTokens > 0 || d.jobCount > 0);

  return (
    <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MaterialIcon name="show_chart" className="text-xl" />
            <div>
              <CardTitle className="font-headline text-[var(--clay-black)]">
                <LocalizedText source={"Tren Penggunaan Token"} />
              </CardTitle>
              <CardDescription className="text-[var(--warm-charcoal)]">
                {period === "daily" && "7 hari terakhir"}
                {period === "weekly" && "4 minggu terakhir"}
                {period === "monthly" && "6 bulan terakhir"}
              </CardDescription>
            </div>
          </div>
          <Tabs
            value={period}
            onValueChange={(v: string | null) => setPeriod((v as Period) ?? "daily")}
          >
            <TabsList variant="line" className="h-8">
              <TabsTrigger value="daily" className="text-xs px-3"><LocalizedText source={"Harian"} /></TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-3"><LocalizedText source={"Mingguan"} /></TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-3"><LocalizedText source={"Bulanan"} /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-lg)]" />
        ) : !hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--warm-charcoal)]">
            <MaterialIcon name="receipt_long" className="text-4xl text-[var(--warm-silver)] mb-3" />
            <p className="font-semibold"><LocalizedText source={"Belum ada data penggunaan"} /></p>
            <p className="text-xs text-[var(--warm-silver)] mt-1">
              <LocalizedText source={"Generate soal untuk melihat statistik penggunaan token."} />
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="jobGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--oat-border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--warm-charcoal)" }}
                axisLine={{ stroke: "var(--oat-border)" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "var(--warm-charcoal)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatTokenValue}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "var(--warm-charcoal)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--pure-white)",
                  border: "2px solid var(--oat-border)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: 13,
                }}
                formatter={(value: unknown, name: unknown) => {
                  const num = typeof value === "number" ? value : 0;
                  const n = typeof name === "string" ? name : "";
                  if (n === "totalTokens") return [num.toLocaleString(locale), ui("Token")];
                  if (n === "jobCount") return [num, "Job"];
                  return [num, n];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(v: string) => {
                  if (v === "totalTokens") return "Token";
                  if (v === "jobCount") return "Job";
                  return v;
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalTokens"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#tokenGradient)"
                name="totalTokens"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="jobCount"
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="url(#jobGradient)"
                name="jobCount"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
