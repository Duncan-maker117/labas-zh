import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, resizeOptions: { fit: "contain", background: "#faf9f7" } },
    apple: { ...preset.apple, resizeOptions: { fit: "contain", background: "#faf9f7" } },
  },
  images: ["public/duncan-icon-transparent.png"],
});
