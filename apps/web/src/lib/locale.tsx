import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Locale = "zh-CN" | "en-US" | "id-ID";

const messages = {
  "zh-CN": {
    dashboard: "学习概览", generate: "AI 出题", jobs: "生成任务", bank: "题库", packages: "练习套题", history: "练习记录", analytics: "学习分析", leaderboard: "排行榜", profile: "个人资料", settings: "设置", admin: "管理后台", language: "界面语言", groupGenerate: "出题", groupBank: "题库", groupPractice: "练习", groupProgress: "学习进度", more: "更多", menu: "菜单", help: "使用指南", signOut: "退出登录", signIn: "登录",
  },
  "en-US": {
    dashboard: "Dashboard", generate: "AI Generator", jobs: "Jobs", bank: "Question Bank", packages: "Practice Sets", history: "History", analytics: "Analytics", leaderboard: "Leaderboard", profile: "Profile", settings: "Settings", admin: "Admin", language: "Interface language", groupGenerate: "Generate", groupBank: "Bank", groupPractice: "Practice", groupProgress: "Progress", more: "More", menu: "Menu", help: "Help", signOut: "Sign out", signIn: "Sign in",
  },
  "id-ID": {
    dashboard: "Dashboard", generate: "AI Lab", jobs: "Jobs", bank: "Bank Soal", packages: "Paket Soal", history: "Riwayat", analytics: "Analytics", leaderboard: "Klasemen", profile: "Profil", settings: "Pengaturan", admin: "Admin", language: "Bahasa antarmuka", groupGenerate: "Generate", groupBank: "Bank", groupPractice: "Latihan", groupProgress: "Track", more: "Lainnya", menu: "Menu", help: "Panduan", signOut: "Keluar", signIn: "Masuk",
  },
} as const;

type MessageKey = keyof typeof messages["zh-CN"];
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const LocaleContext = createContext<LocaleContextValue>({ locale: "zh-CN", setLocale: () => {}, t: (key) => messages["zh-CN"][key] });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "zh-CN";
    const saved = window.localStorage.getItem("labas-locale");
    return saved === "en-US" || saved === "id-ID" ? saved : "zh-CN";
  });
  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem("labas-locale", next);
    setLocaleState(next);
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const t = useCallback((key: MessageKey) => messages[locale][key], [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
