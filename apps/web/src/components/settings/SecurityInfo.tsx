import { LocalizedText } from "@/components/ui/LocalizedText";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@labas/ui/components/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function SecurityInfo() {
  return (
    <div className="max-w-xl">
      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardHeader>
          <CardTitle className="font-headline text-[var(--clay-black)]"><LocalizedText source={"Keamanan"} /></CardTitle>
          <CardDescription className="text-[var(--warm-charcoal)]">
            <LocalizedText source={"Cara penyimpanan API key Anda."} />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-[var(--matcha-300)] rounded-[var(--radius-lg)]">
            <MaterialIcon name="lock" className="text-xl text-[var(--matcha-800)]" />
            <div>
              <p className="font-medium text-[var(--matcha-800)]"><LocalizedText source={"Enkripsi Lokal"} /></p>
              <p className="text-sm text-[var(--matcha-800)]/70">
                <LocalizedText source={"AES-GCM-256 dengan key di IndexedDB"} />
              </p>
            </div>
          </div>
          <div className="text-xs text-[var(--warm-charcoal)] space-y-2">
            <p className="flex items-center gap-2">
              <MaterialIcon name="check_circle" className="text-xs text-[var(--matcha-600)] shrink-0 mt-0.5" />
              <LocalizedText source={"API key tidak pernah dikirim ke server kami"} />
            </p>
            <p className="flex items-center gap-2">
              <MaterialIcon name="check_circle" className="text-xs text-[var(--matcha-600)] shrink-0 mt-0.5" />
              <LocalizedText source={"Data terenkripsi di localStorage browser Anda"} />
            </p>
            <p className="flex items-center gap-2">
              <MaterialIcon name="check_circle" className="text-xs text-[var(--matcha-600)] shrink-0 mt-0.5" />
              <LocalizedText source={"Key enkripsi tersimpan aman di IndexedDB"} />
            </p>
            <p className="flex items-center gap-2">
              <MaterialIcon name="check_circle" className="text-xs text-[var(--matcha-600)] shrink-0 mt-0.5" />
              <LocalizedText source={"BYOK — Bring Your Own Key, platform tidak menyimpan key"} />
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
