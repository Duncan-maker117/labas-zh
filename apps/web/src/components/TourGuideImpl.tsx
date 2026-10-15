import { useState, useEffect, type CSSProperties } from "react";
import { Joyride, type Step, type EventData } from "react-joyride";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useLocale } from "@/lib/locale";

const joyrideOptions = {
  primaryColor: "var(--matcha-600)",
  textColor: "var(--clay-black)",
  backgroundColor: "var(--pure-white)",
  arrowColor: "var(--pure-white)",
  overlayColor: "rgba(0,0,0,0.4)",
};

const joyrideStyles: Record<string, CSSProperties> = {
  buttonBack: { color: "var(--warm-charcoal)", fontSize: "14px", fontWeight: 500 },
  buttonSkip: { color: "var(--warm-charcoal)", fontSize: "14px", fontWeight: 500 },
  tooltipContainer: { textAlign: "left" },
  tooltipContent: { fontSize: "14px", lineHeight: "1.6", padding: "8px 0" },
  tooltipTitle: { fontSize: "18px", fontWeight: 700, fontFamily: "Manrope, sans-serif" },
};

const joyrideLocales = {
  "zh-CN": { back: "上一步", close: "关闭", last: "完成", next: "下一步", skip: "跳过" },
  "en-US": { back: "Back", close: "Close", last: "Finish", next: "Next", skip: "Skip" },
  "id-ID": { back: "Kembali", close: "Tutup", last: "Selesai", next: "Lanjut", skip: "Lewati" },
};

export type { Step, EventData };

// ── Global site tour ──

const LS_GLOBAL = "labas-tour-completed";
const TRIGGER_GLOBAL = "labas-tour-trigger";

const globalSteps: Step[] = [
  { target: "body", placement: "center", title: "Selamat Datang di Labas!", content: "Platform latihan ujian bahasa berbasis AI. Yuk, kita lihat fitur-fitur utamanya!", hideOverlay: true },
  { target: "[data-tour='dashboard-stats']", title: "Ringkasan Aktivitas", content: "Pantau jumlah latihan, waktu belajar, soal terjawab, dan akurasi kamu di sini.", spotlightPadding: 8 },
  { target: "[data-tour='nav-generate']", title: "AI Lab — Generate Soal", content: "Buat soal latihan sendiri pakai AI. Pilih jenis ujian, section, format, dan topik.", spotlightPadding: 4 },
  { target: "[data-tour='nav-bank']", title: "Bank Soal — Buat Paket", content: "Atur soal-soal kamu jadi paket latihan dari bank soal.", spotlightPadding: 4 },
  { target: "[data-tour='nav-packages']", title: "Paket Soal — Mulai Latihan", content: "Temukan paket soal dari komunitas atau buatan sendiri.", spotlightPadding: 4 },
  { target: "[data-tour='nav-analytics']", title: "Analytics — Evaluasi", content: "Lihat analitik mendalam: skor, tren, dan rekomendasi belajar.", spotlightPadding: 4 },
  { target: "body", placement: "center", title: "Siap Belajar?", content: "Setiap halaman punya panduan sendiri. Cari tombol ? di pojok kanan bawah halaman!", hideOverlay: true },
];

const globalStepsZh: Step[] = [
  { target: "body", placement: "center", title: "欢迎使用 Labas！", content: "这是一个 AI 语言考试练习平台。我们来看看主要功能。", hideOverlay: true },
  { target: "[data-tour='dashboard-stats']", title: "学习概览", content: "这里显示练习次数、学习时长、答题数量和正确率。", spotlightPadding: 8 },
  { target: "[data-tour='nav-generate']", title: "AI 出题", content: "选择考试、科目、题型和主题，生成练习题。", spotlightPadding: 4 },
  { target: "[data-tour='nav-bank']", title: "题库与套题", content: "从题库中选择题目，组合成练习套题。", spotlightPadding: 4 },
  { target: "[data-tour='nav-packages']", title: "开始练习", content: "选择已有套题或自己创建的套题进行练习。", spotlightPadding: 4 },
  { target: "[data-tour='nav-analytics']", title: "学习分析", content: "查看分数、趋势和学习建议。", spotlightPadding: 4 },
  { target: "body", placement: "center", title: "准备好了吗？", content: "每个页面右上角的问号按钮都可以打开页面指南。", hideOverlay: true },
];
const globalStepsEn: Step[] = [
  { target: "body", placement: "center", title: "Welcome to Labas!", content: "Explore the main tools in this AI powered language exam practice platform.", hideOverlay: true },
  { target: "[data-tour='dashboard-stats']", title: "Activity Summary", content: "Track practice sessions, study time, answered questions, and accuracy here.", spotlightPadding: 8 },
  { target: "[data-tour='nav-generate']", title: "AI Question Generator", content: "Choose an exam, section, format, and topic to generate practice questions.", spotlightPadding: 4 },
  { target: "[data-tour='nav-bank']", title: "Question Bank", content: "Organize questions into practice sets.", spotlightPadding: 4 },
  { target: "[data-tour='nav-packages']", title: "Practice Sets", content: "Practice with existing or self-created sets.", spotlightPadding: 4 },
  { target: "[data-tour='nav-analytics']", title: "Analytics", content: "Review scores, trends, and study suggestions.", spotlightPadding: 4 },
  { target: "body", placement: "center", title: "Ready to learn?", content: "Use the question mark button at the top right of each page for a guide.", hideOverlay: true },
];

export function TourGuideImpl() {
  const { locale } = useLocale();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const onTrigger = () => { localStorage.removeItem(LS_GLOBAL); setRun(true); };
    window.addEventListener(TRIGGER_GLOBAL, onTrigger);

    const completed = localStorage.getItem(LS_GLOBAL);
    if (!completed) {
      const timer = setTimeout(() => setRun(true), 800);
      return () => { clearTimeout(timer); window.removeEventListener(TRIGGER_GLOBAL, onTrigger); };
    }

    return () => window.removeEventListener(TRIGGER_GLOBAL, onTrigger);
  }, []);

  const handleEvent = (data: EventData) => {
    const { action, status } = data;
    if (status === "finished" || status === "skipped") { localStorage.setItem(LS_GLOBAL, "true"); setRun(false); }
    if (action === "close" || action === "skip") setRun(false);
  };

  return (
    <Joyride steps={locale === "zh-CN" ? globalStepsZh : locale === "en-US" ? globalStepsEn : globalSteps} run={run} continuous
      options={{ ...joyrideOptions, showProgress: true, buttons: ["back", "primary", "skip"] }}
      locale={joyrideLocales[locale]} styles={joyrideStyles} onEvent={handleEvent}
    />
  );
}

// ── Page-specific tour ──

interface PageTourProps {
  storageKey: string;
  steps: Step[];
  autoDelay?: number;
}

export function PageTourImpl({ storageKey, steps, autoDelay }: PageTourProps) {
  const { locale, ui } = useLocale();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const onTrigger = () => { localStorage.removeItem(storageKey); setRun(true); };
    window.addEventListener(storageKey, onTrigger);

    const completed = localStorage.getItem(storageKey);
    if (!completed && autoDelay !== undefined) {
      const timer = setTimeout(() => setRun(true), autoDelay);
      return () => { clearTimeout(timer); window.removeEventListener(storageKey, onTrigger); };
    }

    return () => window.removeEventListener(storageKey, onTrigger);
  }, []);

  const handleEvent = (data: EventData) => {
    const { action, status } = data;
    if (status === "finished" || status === "skipped") { localStorage.setItem(storageKey, "true"); setRun(false); }
    if (action === "close" || action === "skip") setRun(false);
  };

  return (
    <Joyride steps={steps.map((step) => ({
      ...step,
      title: typeof step.title === "string" ? ui(step.title) : step.title,
      content: typeof step.content === "string" ? ui(step.content) : step.content,
    }))} run={run} continuous
      options={{ ...joyrideOptions, showProgress: true, buttons: ["back", "primary", "skip"] }}
      locale={joyrideLocales[locale]} styles={joyrideStyles} onEvent={handleEvent}
    />
  );
}
