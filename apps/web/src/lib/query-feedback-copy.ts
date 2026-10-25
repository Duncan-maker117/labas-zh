import type { Locale } from "./locale";

const messages = {
  "zh-CN": {
    failed: "暂时无法读取数据，请稍后重试。",
    bankFailed: "题库读取失败",
    bankDescription: "暂时无法读取题目，请重试。若持续失败，请联系管理员。",
    loading: "正在加载题目…",
    retry: "重试",
  },
  "en-US": {
    failed: "Unable to load data. Please try again.",
    bankFailed: "Unable to load the question bank",
    bankDescription: "Please try again. Contact an administrator if the problem continues.",
    loading: "Loading questions…",
    retry: "Retry",
  },
  "id-ID": {
    failed: "Data tidak dapat dimuat. Silakan coba lagi.",
    bankFailed: "Bank soal gagal dimuat",
    bankDescription: "Silakan coba lagi. Hubungi administrator jika masalah berlanjut.",
    loading: "Memuat soal…",
    retry: "Coba lagi",
  },
};

export function queryFeedbackCopy(locale: Locale) { return messages[locale]; }
