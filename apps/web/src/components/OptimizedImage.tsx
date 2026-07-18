type OptimizedImageProps = {
  src: string;
  alt: string;
  srcset?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function OptimizedImage({
  src,
  alt,
  srcset,
  sizes,
  priority,
  className,
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      srcSet={srcset}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
