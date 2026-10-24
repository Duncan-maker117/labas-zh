import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const previewUrl = process.env.LABAS_PREVIEW_URL;
const previewHost = previewUrl ? new URL(previewUrl).hostname : undefined;

export default defineConfig({
  server: {
    port: previewHost ? 3002 : 3001,
    host: "127.0.0.1",
    strictPort: true,
    allowedHosts: previewHost ? [previewHost] : undefined,
    proxy: previewHost
      ? {
          "/api": "http://127.0.0.1:3003",
          "/trpc": "http://127.0.0.1:3003",
          "/health": "http://127.0.0.1:3003",
        }
      : undefined,
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor";
          if (id.includes("node_modules/@tanstack/react-router") || id.includes("node_modules/@tanstack/react-query")) return "router";
          if (id.includes("node_modules/recharts")) return "charts";
          if (id.includes("node_modules/react-joyride")) return "tour";
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "labas",
        short_name: "labas",
        description: "面向中文用户的外语考试练习平台",
        lang: "zh-CN",
        theme_color: "#0c0c0c",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: false },
    }),
  ],
});
