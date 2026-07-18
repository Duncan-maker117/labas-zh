export interface OptimizedImageData {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

export const images: Record<string, OptimizedImageData> = {
  hero: {
    src: "/hero_img-1200.webp",
    srcset: "/hero_img-400.webp 400w, /hero_img-800.webp 800w, /hero_img-1200.webp 1200w, /hero_img-1800.webp 1800w",
    width: 1536,
    height: 1024,
  },
  logo: {
    src: "/logo-200.webp",
    srcset: "/logo-100.webp 100w, /logo-200.webp 200w, /logo-400.webp 400w",
    width: 408,
    height: 525,
  },
  generateAi: {
    src: "/generateai-400.webp",
    srcset: "/generateai-200.webp 200w, /generateai-400.webp 400w, /generateai-800.webp 800w",
    width: 537,
    height: 507,
  },
  mocktest: {
    src: "/mocktest-400.webp",
    srcset: "/mocktest-200.webp 200w, /mocktest-400.webp 400w, /mocktest-800.webp 800w",
    width: 466,
    height: 507,
  },
  progress: {
    src: "/progress-400.webp",
    srcset: "/progress-200.webp 200w, /progress-400.webp 400w, /progress-800.webp 800w",
    width: 466,
    height: 517,
  },
  vocabulary: {
    src: "/vocabulary-400.webp",
    srcset: "/vocabulary-200.webp 200w, /vocabulary-400.webp 400w, /vocabulary-800.webp 800w",
    width: 533,
    height: 517,
  },
  diskusi: {
    src: "/diskusi-400.webp",
    srcset: "/diskusi-200.webp 200w, /diskusi-400.webp 400w, /diskusi-800.webp 800w",
    width: 537,
    height: 517,
  },
  latihanSoal: {
    src: "/latihansoal-400.webp",
    srcset: "/latihansoal-200.webp 200w, /latihansoal-400.webp 400w, /latihansoal-800.webp 800w",
    width: 533,
    height: 507,
  },
  notFound: {
    src: "/not_found-800.webp",
    srcset: "/not_found-400.webp 400w, /not_found-800.webp 800w",
    width: 1200,
    height: 762,
  },
};
