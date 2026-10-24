import { BRAND } from "@/lib/brand";

/** The supplied artwork contains both the mark and wordmark. */
export function BrandLogo({
  icon = false,
  responsive = false,
  className = "h-12 w-36",
}: {
  icon?: boolean;
  responsive?: boolean;
  className?: string;
}) {
  return (
    <picture className="inline-flex shrink-0">
      {responsive && <source media="(max-width: 639px)" srcSet={BRAND.icon} />}
      <img
        src={icon ? BRAND.icon : BRAND.logo}
        alt={BRAND.name}
        width={icon ? 512 : 2736}
        height={icon ? 512 : 912}
        className={`rounded-md bg-white object-contain select-none ${className}`}
        decoding="async"
      />
    </picture>
  );
}
