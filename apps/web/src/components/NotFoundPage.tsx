import { LocalizedText } from "@/components/ui/LocalizedText";
import { Link } from "@tanstack/react-router";
import { Button } from "@labas/ui/components/button";
import { images } from "@/lib/app-images";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--warm-cream)] px-6 py-12">
      <img
        src={images.notFound.src}
        alt=""
        loading="lazy"
        className="mb-8 w-full max-w-sm h-auto object-contain"
      />
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-headline font-bold text-[var(--clay-black)] mb-3">
          <LocalizedText source={"Halaman Tidak Ditemukan"} />
        </h1>
        <p className="text-base text-[var(--warm-charcoal)] mb-8">
          <LocalizedText source={"Halaman yang kamu cari tidak ada atau sudah dipindahkan."} />
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            render={<Link to="/" />}
            className="bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] rounded-[var(--radius-lg)] h-12 px-8"
          >
            <LocalizedText source={"Ke Beranda"} />
          </Button>
          <Button
            render={<Link to="/login" />}
            variant="outline"
            className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] h-12 px-8 bg-[var(--pure-white)]"
          >
            <LocalizedText source={"Masuk"} />
          </Button>
        </div>
      </div>
    </div>
  );
}
