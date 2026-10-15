import { LocalizedText } from "@/components/ui/LocalizedText";
import { Card, CardContent, CardHeader, CardTitle } from "@labas/ui/components/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { Link } from "@tanstack/react-router";
import { formatLabel } from "@/lib/format";

interface Weakness {
  type: "format" | "section" | "skill";
  name: string;
  totalQuestions: number;
  accuracyPct: number;
}

interface WeaknessPanelProps {
  weaknesses: Weakness[] | undefined;
  recommendations: string[] | undefined;
}

function getTypeIcon(type: Weakness["type"]) {
  switch (type) {
    case "format":
      return "quiz";
    case "section":
      return "folder";
    case "skill":
      return "psychology";
  }
}

function getTypeLabel(type: Weakness["type"]) {
  switch (type) {
    case "format":
      return "Format";
    case "section":
      return "Section";
    case "skill":
      return "Skill";
  }
}

function getSeverityColor(pct: number) {
  if (pct < 40) return "text-[var(--pomegranate-600)]";
  if (pct < 60) return "text-[var(--lemon-700)]";
  return "text-[var(--matcha-600)]";
}

function getSeverityLabel(pct: number) {
  if (pct < 40) return "Perlu fokus";
  if (pct < 60) return "Butuh latihan";
  return "Cukup baik";
}

export function WeaknessPanel({ weaknesses, recommendations }: WeaknessPanelProps) {
  const hasData = weaknesses && weaknesses.length > 0;

  return (
    <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
      <CardHeader>
        <CardTitle className="text-lg font-headline font-bold text-[var(--clay-black)] flex items-center gap-2">
          <MaterialIcon name="analytics" className="text-[var(--pomegranate-600)]" />
          <LocalizedText source={"Area untuk Ditingkatkan"} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasData ? (
          <>
            <div className="space-y-2">
              {weaknesses.map((w, i) => (
                <div
                  key={`${w.type}-${w.name}`}
                  className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--warm-cream)] border-2 border-[var(--oat-border)]"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--oat-light)] shrink-0">
                    <MaterialIcon name={getTypeIcon(w.type)} className="text-[var(--warm-charcoal)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--warm-silver)] uppercase tracking-wide">
                        {getTypeLabel(w.type)}
                      </span>
                      <span className={`text-xs font-medium ${getSeverityColor(w.accuracyPct)}`}>
                        {getSeverityLabel(w.accuracyPct)}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[var(--clay-black)] truncate">
                      {formatLabel(w.name)}
                    </div>
                    <div className="text-xs text-[var(--warm-charcoal)] mt-0.5">
                      {w.totalQuestions} <LocalizedText source={"soal ·"} /> {w.accuracyPct}<LocalizedText source={"% benar"} />
                    </div>
                  </div>
                  <Link
                    to="/bank"
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] clay-hover transition-all"
                  >
                    <LocalizedText source={"Latih"} />
                  </Link>
                </div>
              ))}
            </div>

            {recommendations && recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--clay-black)]"><LocalizedText source={"Rekomendasi"} /></h4>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--warm-charcoal)]">
                      <MaterialIcon name="lightbulb" className="text-[var(--lemon-700)] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-[var(--warm-charcoal)]">
            <MaterialIcon name="insights" className="text-5xl text-[var(--warm-silver)] mx-auto mb-3" />
            <p className="font-semibold"><LocalizedText source={"Belum cukup data"} /></p>
            <p className="text-sm mt-1"><LocalizedText source={"Selesaikan lebih banyak latihan untuk melihat analisis kelemahan."} /></p>
            <Link
              to="/bank"
              className="inline-block mt-4 px-4 py-2 text-sm font-semibold rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] clay-hover transition-all"
            >
              <LocalizedText source={"Mulai Latihan"} />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
