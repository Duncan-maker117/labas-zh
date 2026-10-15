import { useLocale } from "@/lib/locale";
import { LocalizedText, LocalizedValue } from "@/components/ui/LocalizedText";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Button } from "@labas/ui/components/button";
import { StatCard } from "@/components/admin/StatCard";
import { MonthlyAttemptChart } from "@/components/admin/MonthlyAttemptChart";
import { DailyGenerationChart } from "@/components/admin/DailyGenerationChart";
import { ActiveUsersPanel } from "@/components/admin/ActiveUsersPanel";
import { MostActiveUsersTable } from "@/components/admin/MostActiveUsersTable";
import { TopPackagesTable } from "@/components/admin/TopPackagesTable";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { ui } = useLocale();
  const stats = useQuery(trpc.admin.dashboardStats.queryOptions());
  const trends = useQuery(trpc.admin.dashboardTrends.queryOptions());
  const activeUsers = useQuery(trpc.admin.activeAttempts.queryOptions());
  const mostActive = useQuery(trpc.admin.mostActiveUsers.queryOptions());
  const topPkgs = useQuery(trpc.admin.topPackages.queryOptions());

  if (stats.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }

  const s = stats.data;
  const t = trends.data;
  const poolPct = s && s.poolMax > 0 ? Math.round((s.poolUsed ?? 0) / s.poolMax * 100) : 0;
  const enabled = s?.freeCreditsEnabled ?? false;

  return (
    <div>
      <h1 className="text-3xl font-headline font-bold text-[var(--clay-black)] mb-2"><LocalizedText source={"Admin Dashboard"} /></h1>
      <p className="text-[var(--warm-charcoal)] mb-8"><LocalizedText source={"Platform overview at a glance."} /></p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={ui("Total Users")}
          value={s?.totalUsers ?? 0}
          delta={t ? `+${t.dailySignups.filter((d) => d.count > 0).length} hari aktif` : undefined}
          icon={<MaterialIcon name="group" className="text-[var(--warm-silver)]" />}
        />
        <StatCard
          label={ui("Questions")}
          value={s?.totalQuestions ?? 0}
          icon={<MaterialIcon name="quiz" className="text-[var(--warm-silver)]" />}
        />
        <StatCard
          label={ui("Packages")}
          value={s?.totalPackages ?? 0}
          icon={<MaterialIcon name="library_books" className="text-[var(--warm-silver)]" />}
        />
        <StatCard
          label={ui("Jobs")}
          value={s?.totalJobs ?? 0}
          icon={<MaterialIcon name="schedule" className="text-[var(--warm-silver)]" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={ui("Latihan 7 Hari")}
          value={t?.activeCounts?.week ?? 0}
          deltaColor="green"
          sub={`${t?.activeCounts?.today ?? 0} hari ini`}
        />
        <StatCard
          label={ui("Completion Rate")}
          value={t?.completionRate != null ? `${t.completionRate}%` : "-"}
          deltaColor={t && t.completionRate >= 70 ? "green" : t && t.completionRate >= 40 ? "default" : "red"}
        />
        <StatCard
          label={ui("Generate 7 Hari")}
          value={
            t
              ? t.dailyGenerations
                  .slice(-7)
                  .reduce((sum, d) => sum + Number(d.count), 0)
              : 0
          }
        />
        <StatCard
          label={ui("Signup 7 Hari")}
          value={
            t
              ? t.dailySignups
                  .slice(-7)
                  .reduce((sum, d) => sum + Number(d.count), 0)
              : 0
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <MonthlyAttemptChart
          data={t?.monthlyAttempts}
          isLoading={trends.isLoading}
        />
        <DailyGenerationChart
          genData={t?.dailyGenerations}
          signupData={t?.dailySignups}
          isLoading={trends.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ActiveUsersPanel
          data={activeUsers.data}
          isLoading={activeUsers.isLoading}
        />
        <MostActiveUsersTable
          data={mostActive.data}
          isLoading={mostActive.isLoading}
        />
      </div>

      <div className="mb-6">
        <TopPackagesTable
          data={topPkgs.data}
          isLoading={topPkgs.isLoading}
        />
      </div>

      {/* Free Credit Summary */}
      <div className="bg-[var(--pure-white)] rounded-[var(--radius-xl)] border border-[var(--oat-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-headline font-bold text-[var(--clay-black)]"><LocalizedText source={"Free Credit Pool"} /></h2>
          <Link to="/admin/settings">
            <Button variant="outline" size="sm" className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)]">
              <MaterialIcon name="settings" className="text-sm" />
              <span className="ml-1.5"><LocalizedText source={"Manage in Settings"} /></span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            enabled ? "bg-[var(--matcha-300)] text-[var(--matcha-800)]" : "bg-[var(--pomegranate-100)] text-[var(--pomegranate-600)]"
          }`}>
            <LocalizedValue value={enabled ? "Enabled" : "Disabled"} />
          </span>
          <span className="text-2xl font-headline font-bold text-[var(--clay-black)]">{((s?.poolUsed ?? 0) / 1000).toFixed(0)}K</span>
          <span className="text-sm text-[var(--warm-charcoal)]"><LocalizedText source={"used of"} /> {((s?.poolMax ?? 1000000) / 1000).toFixed(0)}<LocalizedText source={"K tokens"} /></span>
        </div>
        <div className="w-full h-3 bg-[var(--oat-border)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${poolPct > 90 ? "bg-[var(--clay-red)]" : "bg-[var(--matcha-500)]"}`}
            style={{ width: `${Math.min(100, poolPct)}%` }}
          />
        </div>
        <p className="text-xs text-[var(--warm-charcoal)] mt-2">{poolPct}<LocalizedText source={"% used ·"} /> {((s?.poolRemaining ?? 0) / 1000).toFixed(0)}<LocalizedText source={"K remaining"} /></p>
      </div>

      {s && s.totalUsers === 0 && (
        <p className="text-[var(--warm-charcoal)] text-sm mt-6"><LocalizedText source={"No data yet. Stats will appear as users start using the platform."} /></p>
      )}
    </div>
  );
}
