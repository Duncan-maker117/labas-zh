import type { Locale } from "./locale";

const messages = {
  "zh-CN": {
    denied: "需要管理员权限", deniedDescription: "这个账号目前还不能管理网站。", account: "当前登录账号",
    firstAdmin: "网站还没有管理员", setup: "在这台电脑上双击项目目录中的“开通本地管理员.cmd”，选择你自己的账号并点击开通，然后刷新此页。无需提供密码。",
    contact: "请使用管理员账号登录，或让现有管理员在用户管理中为你开通权限。",
    connection: "暂时无法检查管理员权限", connectionDescription: "权限接口连接失败，请确认本地后端正在运行后重试。这不代表账号没有权限。",
    retry: "重新检查权限", back: "返回学习概览",
  },
  "en-US": {
    denied: "Administrator access required", deniedDescription: "This account cannot manage the site yet.", account: "Signed-in account",
    firstAdmin: "No administrator has been configured", setup: "On this computer, open 开通本地管理员.cmd in the project folder, select your own account, grant access, then refresh this page. No password is needed.",
    contact: "Sign in with an administrator account or ask an existing administrator to grant your account access.",
    connection: "Unable to check administrator access", connectionDescription: "The permission service could not be reached. Check the backend and try again. This does not mean your account lacks permission.",
    retry: "Check access again", back: "Back to dashboard",
  },
  "id-ID": {
    denied: "Akses administrator diperlukan", deniedDescription: "Akun ini belum dapat mengelola situs.", account: "Akun yang masuk",
    firstAdmin: "Administrator belum dikonfigurasi", setup: "Di komputer ini, buka 开通本地管理员.cmd pada folder proyek, pilih akun sendiri, aktifkan akses, lalu muat ulang halaman. Kata sandi tidak diperlukan.",
    contact: "Masuk dengan akun administrator atau minta administrator yang ada memberikan akses.",
    connection: "Tidak dapat memeriksa akses administrator", connectionDescription: "Layanan izin tidak terhubung. Periksa backend lalu coba lagi. Ini bukan berarti akun tidak memiliki izin.",
    retry: "Periksa akses lagi", back: "Kembali ke dashboard",
  },
};

export function adminAccessCopy(locale: Locale) { return messages[locale]; }
