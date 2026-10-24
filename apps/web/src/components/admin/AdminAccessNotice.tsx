import { Link } from "@tanstack/react-router";
import { Button } from "@labas/ui/components/button";
import { useLocale } from "@/lib/locale";
import { adminAccessCopy } from "@/lib/admin-access-copy";

interface AdminAccessNoticeProps {
  email?: string;
  connectionError: boolean;
  showLocalSetup: boolean;
  onRetry: () => void;
}

export function AdminAccessNotice({ email, connectionError, showLocalSetup, onRetry }: AdminAccessNoticeProps) {
  const { locale } = useLocale();
  const text = adminAccessCopy(locale);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--warm-cream)] px-6">
      <section className="flex w-full max-w-xl flex-col items-center gap-4 text-center" aria-live="polite">
        <h1 className="text-2xl font-headline font-bold text-[var(--clay-black)]">{connectionError ? text.connection : text.denied}</h1>
        <p className="text-[var(--warm-charcoal)]">{connectionError ? text.connectionDescription : text.deniedDescription}</p>
        {email && <p className="break-all text-sm text-[var(--warm-charcoal)]">{text.account}：{email}</p>}
        {!connectionError && (showLocalSetup ? (
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--oat-border)] bg-[var(--pure-white)] p-4">
            <h2 className="font-semibold">{text.firstAdmin}</h2>
            <p className="text-sm leading-relaxed">{text.setup}</p>
          </div>
        ) : <p className="text-sm text-[var(--warm-charcoal)]">{text.contact}</p>)}
        <Button variant="outline" onClick={onRetry}>{text.retry}</Button>
        <Link to="/dashboard" className="text-[var(--matcha-700)] underline">{text.back}</Link>
      </section>
    </div>
  );
}
