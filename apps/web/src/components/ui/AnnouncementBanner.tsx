import { useLocale } from "@/lib/locale";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const SEVERITY_CONFIG = {
  info: {
    accent: "bg-[var(--slushie-500)]",
    icon: "info",
    textColor: "text-[var(--slushie-800)]",
  },
  warning: {
    accent: "bg-[var(--lemon-500)]",
    icon: "warning",
    textColor: "text-[var(--lemon-800)]",
  },
  error: {
    accent: "bg-[var(--pomegranate-400)]",
    icon: "error",
    textColor: "text-[var(--pomegranate-600)]",
  },
} as const;

export function AnnouncementBanner() {
  const { ui } = useLocale();
  const { data } = useQuery({
    ...trpc.announcement.getActive.queryOptions(),
    staleTime: 60_000,
  });
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!data) {
      setDismissed(false);
      setVisible(false);
      return;
    }
    const hash = data.message.length > 16 ? data.message.slice(0, 16) : data.message;
    const dismissedKey = `announcement_${hash}`;
    const stored = localStorage.getItem(dismissedKey);
    if (stored) {
      const expiry = Number(stored);
      if (Date.now() < expiry) {
        setDismissed(true);
        setVisible(false);
        return;
      }
      localStorage.removeItem(dismissedKey);
    }
    setDismissed(false);
    setVisible(true);
  }, [data]);

  const handleDismiss = () => {
    if (!data) return;
    const hash = data.message.length > 16 ? data.message.slice(0, 16) : data.message;
    localStorage.setItem(`announcement_${hash}`, String(Date.now() + 24 * 60 * 60 * 1000));
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed || !data) return null;

  const cfg = SEVERITY_CONFIG[data.severity];

  return (
    <div className="sticky top-0 z-50 bg-[var(--warm-cream)] border-b-2 border-[var(--oat-border)] shadow-sm">
      <div className="flex items-center gap-3 px-4 md:px-6 py-2.5 max-w-7xl mx-auto">
        <div className={`w-1 h-8 rounded-full shrink-0 ${cfg.accent}`} />
        <MaterialIcon name={cfg.icon} className={`text-lg shrink-0 ${cfg.textColor}`} />
        <p className={`text-sm font-medium flex-1 ${cfg.textColor}`}>{data.message}</p>
        <button
          onClick={handleDismiss}
          aria-label={ui("Tutup pengumuman")}
          className="shrink-0 text-[var(--warm-charcoal)] hover:text-[var(--clay-black)] transition-colors cursor-pointer"
        >
          <MaterialIcon name="close" className="text-lg" />
        </button>
      </div>
    </div>
  );
}
