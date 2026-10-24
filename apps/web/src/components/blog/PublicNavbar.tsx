import { useLocale } from "@/lib/locale";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { Link } from "@tanstack/react-router";
import { Button } from "@labas/ui/components/button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { env } from "@labas/env/web";
import { images } from "@/lib/app-images";

export function PublicNavbar() {
  const { ui } = useLocale();

  return (
    <>
      <nav className="w-full px-6 py-4 md:px-12 lg:px-16 flex items-center justify-between max-w-7xl mx-auto z-50 sticky top-0 bg-[var(--warm-cream)] border-b-2 border-[var(--oat-border)]">
        <Link to="/" className="flex items-center gap-3">
          <img src={images.logo.src} alt={ui("Labas Logo")} className="h-10 w-auto object-contain" />
          <span className="font-headline font-semibold text-2xl tracking-[-0.64px] text-[var(--clay-black)] hidden sm:block"><LocalizedText source={"Labas"} /></span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {env.VITE_BLOG_ENABLED && (
            <Link to="/blog" className="text-[var(--warm-charcoal)] hover:text-[var(--matcha-700)] transition-colors p-2 hidden md:flex items-center gap-2">
              <MaterialIcon name="article" className="text-xl" />
              <span className="font-semibold text-base"><LocalizedText source={"Artikel"} /></span>
            </Link>
          )}
          <div className="w-px h-6 bg-[var(--oat-border)] hidden sm:block mx-2"></div>
          <Link to="/login">
            <Button variant="ghost" className="text-[var(--clay-black)] font-semibold hover:bg-[var(--oat-light)] rounded-[12px] text-lg px-4 sm:px-6 h-12">
              <LocalizedText source={"Masuk"} />
            </Button>
          </Link>
          <Link to="/login">
            <Button className="bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--dark-charcoal)] rounded-[24px] h-12 px-6 sm:px-8 font-semibold text-lg clay-hover clay-shadow">
              <LocalizedText source={"Mulai Gratis"} />
            </Button>
          </Link>
        </div>
      </nav>
    </>
  );
}
