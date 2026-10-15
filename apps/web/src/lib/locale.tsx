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
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string; ui: (source: string) => string };
const LocaleContext = createContext<LocaleContextValue>({ locale: "zh-CN", setLocale: () => {}, t: (key) => messages["zh-CN"][key], ui: (source) => interfaceText["zh-CN"][source] ?? source });

// Source strings are kept as keys so existing Indonesian copy remains available
// while page content follows the same preference as the navigation.
const interfaceText: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    "Halo, ": "你好，", "Pengguna": "用户", "Siap mulai belajar? Pilih langkah di bawah ini.": "准备开始学习了吗？请从下面选择一步。", "Lanjutkan latihanmu!": "继续练习吧！",
    "Selamat Datang di Labas": "欢迎使用 Labas", "Platform latihan ujian bahasa berbasis AI. Ikuti 3 langkah mudah untuk memulai:": "AI 语言考试练习平台。只需三步，开始学习：",
    "Generate Soal": "AI 出题", "Buat soal dengan AI": "使用 AI 创建练习题", "Buat Paket": "创建套题", "Kumpulkan soal latihan": "组合练习题", "Mulai Latihan": "开始练习", "Kerjakan paket soal": "完成练习套题",
    "Latihan Selesai": "已完成练习", "Waktu Latihan": "练习时长", "Soal Terjawab": "已答题数", "Akurasi": "正确率", "Generate Soal Baru": "创建新题目", "Lihat Analitik": "查看学习分析",
    "Editor's Pick": "精选推荐", "Lihat Semua": "查看全部", "Artikel Terbaru": "最新文章", "Latihan Terakhir": "最近练习", "Paket tidak diketahui": "未知套题", "Hasil": "查看结果",
    "Bank Soal": "题库", "Simpan, publikasikan, dan buat paket dari soal pilihan.": "保存、发布题目，并用选中的题目创建套题。", "Riwayat": "练习记录", "Lihat kembali hasil dan progres latihan kamu.": "查看练习结果与学习进度。", "Pengaturan": "设置", "Kelola API key dan preferensi akun kamu.": "管理 API 密钥和账号偏好。",
    "AI Exam Generator": "AI 考试出题", "Generate soal latihan dengan AI. Pilih exam, section, format, dan topik — sisanya AI yang kerjakan.": "选择考试、科目、题型和主题，让 AI 为你生成练习题。",
    "Pilih exam & section": "选择考试与科目", "Atur jumlah & format": "设置题量与题型", "Generate & simpan": "生成并保存", "Buat paket dari Bank Soal": "从题库创建套题",
    "API key belum dikonfigurasi.": "尚未配置 API 密钥。", "Tambahkan di Settings →": "前往设置添加 →", "Belum ada API key. Kamu bisa pakai Free Credits!": "尚未配置 API 密钥，可以使用免费额度。", "Gunakan Free Credits →": "使用免费额度 →",
    "Generation Mode": "生成方式", "BYOK": "自带 API 密钥", "Free Credits": "免费额度", "Atur BYOK di Settings": "在设置中配置 API 密钥", "Token kamu": "你的 Token", "Provider / API Key": "服务商 / API 密钥", "Pilih provider...": "选择服务商…", "Kelola": "管理", "Tambahkan API key di Settings dahulu.": "请先在设置中添加 API 密钥。", "Belum ada API key?": "还没有 API 密钥？", "Gunakan kredit gratis": "使用免费额度", "atau tambah di Settings.": "或前往设置添加。", "Free credits sedang dinonaktifkan oleh admin.": "管理员已停用免费额度。",
    "Jenis Ujian": "考试类型", "Section": "科目", "dipilih": "已选", "Jumlah Soal": "题目数量", "soal": "题", "Custom:": "自定义：", "Auto Multi-Section": "自动分配科目", "Tingkat Kesulitan": "难度", "Format Soal": "题型", "Topik": "主题", "Fokus Latihan": "练习重点", "Intelligent Focus": "智能侧重", "Soal Seimbang": "均衡出题", "Fokus Kelemahan": "侧重薄弱项", "Hasil Generate": "生成结果", "Bersihkan": "清空", "Hasil generate": "生成结果", "Tutup tab": "关闭标签页",
    "Test Blueprint": "出题方案", "Ujian": "考试", "Format": "题型", "Estimasi Durasi": "预计用时", "Soal": "题", "Jenis": "种", "Menit": "分钟", "AI Confidence Score": "练习侧重比例", "Probabilitas tinggi untuk mengatasi blindspot linguistik utama.": "这个数值由上方滑块设置，用于预览当前的练习侧重。", "Quick": "快速生成", "Agentic": "分步生成", "Mode Agentic": "分步生成模式", "Multi-step validation: passage → validate → questions → self-check → quality score. Lebih lambat tapi kualitas lebih terjamin.": "依次生成材料、校验、出题和自检；需要更长时间。", "Generate & Launch": "生成并开始", "Generating...": "正在生成…", "Tutup error": "关闭错误提示",
    "Multiple Choice": "单项选择", "True / False / Not Given": "判断 / 未提及", "Fill in Blank": "填空", "Synonym / Vocabulary": "同义词 / 词汇", "Grammar in Context": "语境语法", "Sentence Completion": "句子补全", "Cloze Test": "完形填空", "Reference (Pronoun)": "代词指代", "Author's View": "作者观点", "Matching Headings": "标题匹配", "Matching Information": "信息匹配", "Summary Completion": "摘要填空", "Matching Pairs": "配对", "Error Recognition": "错误辨识", "Text Insertion": "句子插入", "Kanji Reading": "汉字读音", "Particle / Conjunction Choice": "助词 / 连词选择", "Article / Gender / Agreement": "冠词 / 性数一致", "Character Reading": "文字读音", "Sentence Arrangement": "句子排序", "Situational Judgment (TKP)": "情境判断（TKP）",
    "Science & Tech": "科学与技术", "Business": "商业", "Sociology": "社会学", "Arts": "艺术", "History": "历史", "Environment": "环境", "Health": "健康", "Education": "教育", "Daily Interaction": "日常交流", "Social Etiquette": "社交礼仪", "Workplace": "职场", "Beginner": "入门", "Elementary": "初级", "Intermediate": "中级", "Advanced": "高级", "Expert": "专家级", "Drill cepat": "快速练习", "Latihan fokus": "专项练习", "Mini test": "小测验", "Full test": "完整测验",
    "Token habis. Auto-refill tersedia saat kamu generate.": "Token 已用完，下次出题时可自动补充。", "API key belum dikonfigurasi. Tambahkan di Settings atau gunakan kredit gratis.": "尚未配置 API 密钥。请到设置中添加，或使用免费额度。", "Pilih minimal 1 section.": "请至少选择一个科目。", "Pilih minimal 1 format soal.": "请至少选择一种题型。",
    "Paket latihan berhasil dibuat! Soal juga tersimpan di Bank Soal (privat). Jawaban & penjelasan disembunyikan agar latihan tetap fair.": "练习套题已创建，题目已保存到私人题库。为保证练习效果，答案和解析暂时隐藏。", "Lihat Paket": "查看套题",
  },
  "en-US": {
    "Halo, ": "Hello, ", "Pengguna": "User", "Siap mulai belajar? Pilih langkah di bawah ini.": "Ready to learn? Choose a step below.", "Lanjutkan latihanmu!": "Continue practicing!", "Selamat Datang di Labas": "Welcome to Labas", "Platform latihan ujian bahasa berbasis AI. Ikuti 3 langkah mudah untuk memulai:": "An AI powered language exam practice platform. Get started in three steps.", "Generate Soal": "Generate Questions", "Buat soal dengan AI": "Create questions with AI", "Buat Paket": "Create a Set", "Kumpulkan soal latihan": "Collect practice questions", "Mulai Latihan": "Start Practicing", "Kerjakan paket soal": "Work through a question set", "Latihan Selesai": "Completed Practices", "Waktu Latihan": "Practice Time", "Soal Terjawab": "Questions Answered", "Akurasi": "Accuracy", "Generate Soal Baru": "Generate New Questions", "Lihat Analitik": "View Analytics", "Editor's Pick": "Editor's Picks", "Lihat Semua": "View All", "Artikel Terbaru": "Latest Articles", "Latihan Terakhir": "Recent Practices", "Paket tidak diketahui": "Unknown set", "Hasil": "Results", "Bank Soal": "Question Bank", "Simpan, publikasikan, dan buat paket dari soal pilihan.": "Save, publish, and build sets from selected questions.", "Riwayat": "History", "Lihat kembali hasil dan progres latihan kamu.": "Review your results and progress.", "Pengaturan": "Settings", "Kelola API key dan preferensi akun kamu.": "Manage API keys and account preferences.",
    "AI Exam Generator": "AI Exam Generator", "Generate soal latihan dengan AI. Pilih exam, section, format, dan topik — sisanya AI yang kerjakan.": "Choose an exam, section, format, and topic. AI will generate practice questions for you.", "Pilih exam & section": "Choose exam and section", "Atur jumlah & format": "Set count and format", "Generate & simpan": "Generate and save", "Buat paket dari Bank Soal": "Build a set from the bank", "API key belum dikonfigurasi.": "API key is not configured.", "Tambahkan di Settings →": "Add one in Settings →", "Belum ada API key. Kamu bisa pakai Free Credits!": "No API key yet. You can use free credits.", "Gunakan Free Credits →": "Use free credits →", "Generation Mode": "Generation Mode", "BYOK": "Your API key", "Free Credits": "Free Credits", "Atur BYOK di Settings": "Configure your API key in Settings", "Token kamu": "Your tokens", "Provider / API Key": "Provider / API Key", "Pilih provider...": "Choose a provider…", "Kelola": "Manage", "Tambahkan API key di Settings dahulu.": "Add an API key in Settings first.", "Belum ada API key?": "No API key?", "Gunakan kredit gratis": "Use free credits", "atau tambah di Settings.": "or add one in Settings.", "Free credits sedang dinonaktifkan oleh admin.": "Free credits are disabled by the administrator.",
    "Jenis Ujian": "Exam Type", "Section": "Section", "dipilih": "selected", "Jumlah Soal": "Question Count", "soal": "questions", "Custom:": "Custom:", "Auto Multi-Section": "Automatic Section Split", "Tingkat Kesulitan": "Difficulty", "Format Soal": "Question Format", "Topik": "Topic", "Fokus Latihan": "Practice Focus", "Intelligent Focus": "Intelligent Focus", "Soal Seimbang": "Balanced Questions", "Fokus Kelemahan": "Focus on Weaknesses", "Hasil Generate": "Generated Results", "Bersihkan": "Clear", "Hasil generate": "Generated results", "Tutup tab": "Close tab", "Test Blueprint": "Test Blueprint", "Ujian": "Exam", "Format": "Format", "Estimasi Durasi": "Estimated Duration", "Soal": "Questions", "Jenis": "types", "Menit": "minutes", "AI Confidence Score": "AI Match Estimate", "Probabilitas tinggi untuk mengatasi blindspot linguistik utama.": "An estimate based on your chosen practice focus.", "Quick": "Quick", "Agentic": "Step by step", "Mode Agentic": "Step by step mode", "Multi-step validation: passage → validate → questions → self-check → quality score. Lebih lambat tapi kualitas lebih terjamin.": "Generate material, validate, create questions, and self-check. This takes longer.", "Generate & Launch": "Generate and Start", "Generating...": "Generating…", "Tutup error": "Dismiss error", "Token habis. Auto-refill tersedia saat kamu generate.": "Tokens exhausted. They can refill automatically when you generate again.", "API key belum dikonfigurasi. Tambahkan di Settings atau gunakan kredit gratis.": "Add an API key in Settings or use free credits.", "Pilih minimal 1 section.": "Choose at least one section.", "Pilih minimal 1 format soal.": "Choose at least one question format.",
    "Drill cepat": "Quick drill", "Latihan fokus": "Focused practice", "Mini test": "Mini test", "Full test": "Full test",
    "Paket latihan berhasil dibuat! Soal juga tersimpan di Bank Soal (privat). Jawaban & penjelasan disembunyikan agar latihan tetap fair.": "Practice set created. Questions were saved privately in the question bank. Answers and explanations stay hidden during practice.", "Lihat Paket": "View Set",
  },
  "id-ID": {},
};

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
  const ui = useCallback((source: string) => interfaceText[locale][source] ?? source, [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale, t, ui }}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
