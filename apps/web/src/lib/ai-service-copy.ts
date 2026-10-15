import type { Locale } from "./locale";

const copy = {
  "zh-CN": {
    title: "平台 AI", description: "选择练习内容后直接生成，无需配置。", balance: "可用 AI 额度", reserved: "进行中任务预留", loading: "正在检查 AI 服务…", retry: "重新检查",
    unavailable: "AI 服务暂不可用，请稍后重试或联系平台管理员。", notConfigured: "平台 AI 尚未开通，请联系平台管理员。", loadError: "暂时无法读取 AI 额度，请重试。",
    insufficient: "本次所需额度不足，请减少题目数量、选择快速生成，或联系平台管理员。", tooMany: "平台 AI 每次最多生成 20 题，请减少题目数量。",
    estimate: "本次最多预留", units: "单位额度", settlement: "完成后按消耗结算，退回未用额度。失败或取消仅结算已发生的用量；服务商未返回用量时按保守估计结算。",
    advanced: "高级选项", ownKey: "使用自己的 API Key（可选）", keyLabel: "选择自己的 AI 配置", chooseKey: "选择配置", manage: "管理个人配置", missingKey: "请先添加个人配置，或关闭此选项使用平台 AI。",
    settingsTitle: "高级 AI 配置", settingsHelp: "普通使用无需填写 API Key。只有希望使用个人 AI 服务时，才需要在这里配置。", settingsDescription: "管理 AI 用量、账号和界面偏好。", usageTab: "AI 用量",
    errors: {
      "Generation already in progress": "已有 AI 任务正在处理，请等待结束后再试。",
      "Daily AI allowance reached. Try again tomorrow": "今日 AI 额度已达到上限，请明天再试。",
      "Platform AI daily allowance reached. Try again tomorrow": "平台今日 AI 额度已用完，请明天再试。",
      "Insufficient AI allowance. Reduce the question count or contact support": "AI 额度不足，请减少题目数量、选择快速生成，或联系平台管理员。",
      "Platform AI supports at most 20 questions per task": "平台 AI 每次最多生成 20 题。",
      "Platform AI is currently unavailable. Contact support": "平台 AI 暂不可用，请联系平台管理员。",
      "Platform AI is not configured. Contact support": "平台 AI 尚未开通，请联系平台管理员。",
      "Account is suspended": "账号已被停用，请联系平台管理员。",
    } as Record<string, string>,
  },
  "en-US": {
    title: "Platform AI", description: "Choose your practice content and generate. No setup required.", balance: "Available AI allowance", reserved: "Reserved for active tasks", loading: "Checking AI availability…", retry: "Check again",
    unavailable: "AI is temporarily unavailable. Try later or contact support.", notConfigured: "Platform AI is not configured yet. Contact support.", loadError: "Unable to load your AI allowance. Try again.",
    insufficient: "Not enough allowance. Choose fewer questions, use quick mode, or contact support.", tooMany: "Platform AI supports up to 20 questions per task.",
    estimate: "Maximum reservation", units: "allowance units", settlement: "Unused allowance is returned after settlement. Failed or cancelled tasks only settle usage already incurred. If the provider omits usage, a conservative estimate applies.",
    advanced: "Advanced options", ownKey: "Use my own API key (optional)", keyLabel: "Your AI configuration", chooseKey: "Choose configuration", manage: "Manage personal configuration", missingKey: "Add your configuration or turn this option off to use platform AI.",
    settingsTitle: "Advanced AI configuration", settingsHelp: "Normal use does not require an API key. Configure this only to use your own AI service.", settingsDescription: "Manage AI usage, account, and interface preferences.", usageTab: "AI usage", errors: {} as Record<string, string>,
  },
  "id-ID": {
    title: "AI Platform", description: "Pilih materi latihan dan langsung buat soal. Tanpa konfigurasi.", balance: "Kuota AI tersedia", reserved: "Dicadangkan untuk tugas aktif", loading: "Memeriksa layanan AI…", retry: "Periksa lagi",
    unavailable: "AI sementara tidak tersedia. Coba lagi atau hubungi admin.", notConfigured: "AI platform belum dikonfigurasi. Hubungi admin.", loadError: "Kuota AI gagal dimuat. Coba lagi.",
    insufficient: "Kuota tidak cukup. Kurangi soal, gunakan mode cepat, atau hubungi admin.", tooMany: "AI platform mendukung maksimal 20 soal per tugas.",
    estimate: "Cadangan maksimum", units: "unit kuota", settlement: "Kuota yang tidak digunakan dikembalikan. Tugas gagal atau dibatalkan hanya menghitung pemakaian yang terjadi. Jika penyedia tidak melaporkan pemakaian, estimasi konservatif digunakan.",
    advanced: "Opsi lanjutan", ownKey: "Gunakan API key sendiri (opsional)", keyLabel: "Konfigurasi AI pribadi", chooseKey: "Pilih konfigurasi", manage: "Kelola konfigurasi pribadi", missingKey: "Tambahkan konfigurasi atau nonaktifkan opsi ini untuk memakai AI platform.",
    settingsTitle: "Konfigurasi AI lanjutan", settingsHelp: "Penggunaan biasa tidak membutuhkan API key. Isi hanya jika ingin memakai layanan AI sendiri.", settingsDescription: "Kelola pemakaian AI, akun, dan preferensi antarmuka.", usageTab: "Pemakaian AI", errors: {} as Record<string, string>,
  },
};

export function aiServiceCopy(locale: Locale) { return copy[locale]; }
export function aiServiceError(message: string, locale: Locale) { return copy[locale].errors[message] ?? message; }
