import { LocalizedText } from "@/components/ui/LocalizedText";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { Card, CardContent } from "@labas/ui/components/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Avatar } from "@/components/ui/Avatar";

export const Route = createFileRoute("/profile/$userId")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { userId } = Route.useParams();
  const query = useQuery(trpc.profile.getById.queryOptions({ userId }));

  if (query.isLoading) {
    return (
      <div className="min-h-screen pt-8 pb-32 px-6 md:px-12 lg:px-16 max-w-5xl mx-auto bg-[var(--warm-cream)]">
        <div className="h-32 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-xl)] mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-xl)]" />
          ))}
        </div>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="min-h-screen pt-8 pb-32 px-6 md:px-12 lg:px-16 max-w-5xl mx-auto bg-[var(--warm-cream)]">
        <div className="text-center py-20">
          <MaterialIcon name="person_off" className="text-6xl text-[var(--warm-silver)] mx-auto mb-4" />
          <p className="text-lg text-[var(--warm-charcoal)] font-semibold"><LocalizedText source={"Pengguna tidak ditemukan"} /></p>
        </div>
      </div>
    );
  }

  const { user, stats, recentPackages } = query.data;

  return (
    <div className="min-h-screen pt-8 pb-32 px-6 md:px-12 lg:px-16 max-w-5xl mx-auto bg-[var(--warm-cream)]">
      {/* Profile Header */}
      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)] mb-8">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-4 md:gap-6">
            <Avatar
              src={user.image}
              name={user.name}
              size="xl"
              variant="profile"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-[var(--clay-black)]">
                {user.name ?? "Pengguna"}
              </h1>
              <p className="text-sm text-[var(--warm-charcoal)] mt-1">
                <LocalizedText source={"Bergabung"} /> {new Date(user.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
              {stats.totalPackages}
            </div>
            <div className="text-xs text-[var(--warm-charcoal)] mt-1"><LocalizedText source={"Paket Dibuat"} /></div>
          </CardContent>
        </Card>
        <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
              {stats.totalPackageUsage}
            </div>
            <div className="text-xs text-[var(--warm-charcoal)] mt-1"><LocalizedText source={"Paket Digunakan"} /></div>
          </CardContent>
        </Card>
        <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
              {stats.totalQuestions}
            </div>
            <div className="text-xs text-[var(--warm-charcoal)] mt-1"><LocalizedText source={"Soal Dibuat"} /></div>
          </CardContent>
        </Card>
        <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-headline font-extrabold text-[var(--clay-black)]">
              {stats.avgPackageRating > 0 ? stats.avgPackageRating : "-"}
            </div>
            <div className="text-xs text-[var(--warm-charcoal)] mt-1"><LocalizedText source={"Rating Rata-rata"} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Public Packages */}
      <section>
        <h2 className="text-xl font-headline font-bold text-[var(--clay-black)] mb-4">
          <LocalizedText source={"Paket Publik Terbaru"} />
        </h2>

        {recentPackages.length === 0 ? (
          <div className="text-center py-12 text-[var(--warm-charcoal)]">
            <MaterialIcon name="folder_open" className="text-4xl text-[var(--warm-silver)] mx-auto mb-3" />
            <p><LocalizedText source={"Belum ada paket publik"} /></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPackages.map((pkg) => (
              <Link to="/package/$id" params={{ id: pkg.id }} key={pkg.id} className="block">
                <Card className="clay-shadow clay-hover bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)] h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-[var(--matcha-300)] text-[var(--matcha-800)] text-xs font-semibold">
                        {pkg.examTypeName}
                      </span>
                      {pkg.avgRating && (
                        <div className="flex items-center gap-1 text-[var(--lemon-700)]">
                          <MaterialIcon name="star" className="text-sm" />
                          <span className="text-xs font-bold">{pkg.avgRating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-headline text-base font-bold text-[var(--clay-black)] line-clamp-2 mb-2">
                      {pkg.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-[var(--warm-charcoal)]">
                      <span>{pkg.totalQuestions} <LocalizedText source={"soal"} /></span>
                      <span>{pkg.usageCount}<LocalizedText source={"x digunakan"} /></span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
