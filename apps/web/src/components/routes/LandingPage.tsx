import { LocalizedText } from "@/components/ui/LocalizedText";
import { Link } from "@tanstack/react-router";
import { Button } from "@labas/ui/components/button";
import { Card, CardContent } from "@labas/ui/components/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useState } from "react";
import { images } from "@/lib/app-images";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useLocale } from "@/lib/locale";
import { BrandLogo } from "@/components/BrandLogo";

function FeatureArtwork({ src }: { src: string }) {
  return (
    <div className="relative flex aspect-video items-center justify-center bg-white p-8">
      <div className="absolute left-5 top-4"><BrandLogo className="h-10 w-[120px]" /></div>
      <img src={src} alt="" loading="lazy" className="h-full max-h-[360px] w-auto max-w-full object-contain pt-8" />
    </div>
  );
}

function FaqItem({ question, answer, isDark }: { question: string; answer: string; isDark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border-b-2 py-6 ${isDark ? 'border-[var(--ube-300)]/30' : 'border-[var(--oat-border)]'} last:border-b-0`}>
      <button
        type="button"
        className="flex w-full items-center justify-between text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={`font-headline font-semibold text-2xl tracking-[-0.64px] transition-colors ${isDark ? 'text-[var(--pure-white)] group-hover:text-[var(--ube-300)]' : 'text-[var(--clay-black)] group-hover:text-[var(--matcha-700)]'}`}>
          {question}
        </span>
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${isDark ? 'border-[var(--ube-300)]/50 text-[var(--pure-white)] group-hover:bg-[var(--ube-300)]/20' : 'border-[var(--oat-border)] text-[var(--clay-black)] group-hover:bg-[var(--oat-light)]'}`}>
          <MaterialIcon
            name="expand_more"
            className="text-2xl"
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className={`text-lg leading-relaxed pr-12 ${isDark ? 'text-[var(--ube-300)]' : 'text-[var(--warm-charcoal)]'}`}>
          {answer}
        </p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { ui } = useLocale();
  const { locale, setLocale } = useLocale();
  return (
    <div className="min-h-screen bg-[var(--warm-cream)] flex flex-col font-sans selection:bg-[var(--matcha-300)] selection:text-[var(--clay-black)]">
      {/* Navbar */}
      <nav className="w-full px-4 sm:px-6 py-4 md:px-12 lg:px-16 flex items-center justify-between gap-2 max-w-7xl mx-auto z-50 sticky top-0 bg-[var(--warm-cream)] border-b-2 border-[var(--oat-border)]">
        <div className="flex items-center gap-3">
          <BrandLogo responsive className="size-11 sm:h-[60px] sm:w-[180px]" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <label className="sr-only" htmlFor="landing-locale"><LocalizedText source={"界面语言"} /></label>
          <select id="landing-locale" value={locale} onChange={(event) => setLocale(event.target.value as "zh-CN" | "en-US" | "id-ID")} className="max-w-24 sm:max-w-none rounded border border-[var(--oat-border)] bg-transparent px-2 py-2 text-xs sm:text-sm text-[var(--clay-black)]"><option value="zh-CN">简体中文</option><option value="en-US">English</option><option value="id-ID">Bahasa Indonesia</option></select>
          <div className="w-px h-6 bg-[var(--oat-border)] hidden sm:block mx-2"></div>
          <Link to="/login">
            <Button variant="ghost" className="text-[var(--clay-black)] font-semibold hover:bg-[var(--oat-light)] rounded-[12px] text-sm sm:text-lg px-2 sm:px-6 h-10 sm:h-12">
              <LocalizedText source={"登录"} />
            </Button>
          </Link>
          <Link to="/login">
            <Button className="bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--dark-charcoal)] rounded-[24px] h-10 sm:h-12 px-3 sm:px-8 font-semibold text-sm sm:text-lg clay-hover clay-shadow">
              <LocalizedText source={"免费开始"} />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center overflow-x-hidden">
        {/* HUGE HERO SECTION */}
        <section className="w-full px-6 md:px-12 lg:px-16 pt-16 pb-20 md:pt-24 md:pb-32 flex flex-col xl:flex-row items-center justify-between gap-12 lg:gap-16 relative max-w-[1440px] mx-auto">
          <div className="flex-1 text-center xl:text-left space-y-8 z-10 w-full max-w-[800px] xl:max-w-none">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--matcha-300)] border-2 border-[var(--matcha-800)] text-[var(--clay-black)] uppercase-label shadow-sm mx-auto xl:mx-0 transform -rotate-2">
              <MaterialIcon name="auto_awesome" className="text-sm" />
              <span><LocalizedText source={"AI 驱动的语言考试练习"} /></span>
            </div>

            <h1 className="text-[50px] md:text-[70px] lg:text-[85px] font-headline font-semibold text-[var(--clay-black)] tracking-[-2.4px] lg:tracking-[-3.2px] leading-[1.0] lg:leading-[0.95] drop-shadow-sm">
              <LocalizedText source={"面向中文学习者的外语考试练习平台"} />
            </h1>

            <p className="text-xl md:text-2xl text-[var(--warm-charcoal)] max-w-2xl mx-auto xl:mx-0 leading-relaxed">
              <LocalizedText source={"通过交互式题库、真实考试模拟和 AI 出题，高效准备 TOEFL、IELTS、JLPT、TOPIK 等语言考试。"} />
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center xl:justify-start pt-6">
              <Link to="/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[var(--pure-white)] text-[var(--clay-black)] rounded-[24px] h-[64px] px-8 text-xl font-semibold border-2 border-[var(--oat-border)] clay-shadow clay-hover">
                  <LocalizedText source={"立即开始练习"} />
                </Button>
              </Link>
            </div>
          </div>

          {/* MASSIVE HERO IMAGE WITH FLOATING ASSETS - SIDE BY SIDE ON DESKTOP */}
          <div className="flex-1 w-full relative group mt-8 xl:mt-0 flex justify-center xl:justify-end">
            <div className="relative w-full max-w-[650px] lg:max-w-[750px]">
              <OptimizedImage
                src={images.hero.src}
                srcset={images.hero.srcset}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
                alt={ui("DUNCAN Logo")}
                priority
                className="w-full h-auto object-contain transform transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-1 drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10"
              />
              {/* Variatif Floating Elements */}
              <div className="absolute -top-8 -left-8 md:-top-12 md:-left-12 w-32 md:w-40 h-auto z-20 hidden sm:block">
                <img src={images.generateAi.src} alt="" loading="lazy" className="w-full h-auto drop-shadow-2xl" />
              </div>
              <div className="absolute -bottom-8 -right-8 md:-bottom-12 md:-right-12 w-40 md:w-48 h-auto z-20 hidden sm:block">
                <img src={images.mocktest.src} alt="" loading="lazy" className="w-full h-auto drop-shadow-2xl" />
              </div>
              <div className="absolute top-[40%] -left-16 md:-left-24 w-24 md:w-32 h-auto z-0 hidden lg:block opacity-80 blur-[1px]">
                <img src={images.progress.src} alt="" loading="lazy" className="w-full h-auto drop-shadow-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* VIDEO DEMO SECTION - DYNAMIC ZIGZAG */}
        <section id="demo" className="w-full bg-[var(--warm-cream)] py-20 pb-32 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-40 -left-64 w-[500px] h-[500px] bg-[var(--matcha-300)]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-40 -right-64 w-[600px] h-[600px] bg-[var(--slushie-500)]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ube-300)]/30 border-2 border-[var(--ube-300)] text-[var(--ube-800)] uppercase-label shadow-sm">
                <MaterialIcon name="play_circle" className="text-sm" />
                <span><LocalizedText source={"功能演示"} /></span>
              </div>
              <h2 className="text-[50px] md:text-[60px] font-headline font-semibold text-[var(--clay-black)] tracking-[-2.4px] leading-tight drop-shadow-sm">
                <LocalizedText source={"从题库练习到成绩分析，规划你的备考"} />
              </h2>
            </div>

            <div className="space-y-32">
              {/* Feature 1: Hero Showcase - Generate AI */}
              <div className="flex flex-col items-center text-center pb-8 pt-4">
                <div className="max-w-3xl space-y-5 mb-10">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--ube-300)]/20 border-2 border-[var(--ube-300)]/50 text-[var(--ube-800)] text-sm font-bold tracking-wide uppercase-label mb-2"><LocalizedText source={"✨ 核心功能"} /></div>
                  <h3 className="text-[36px] md:text-[45px] lg:text-[55px] font-headline font-semibold text-[var(--clay-black)] leading-[1.1] tracking-[-1.5px]">
                    <LocalizedText source={"生成练习题"} /> <br className="hidden sm:block md:hidden" /> <span className="text-[var(--ube-800)]"><LocalizedText source={"Agentic AI"} /></span>
                  </h3>
                  <p className="text-lg md:text-xl text-[var(--warm-charcoal)] leading-relaxed max-w-2xl mx-auto">
                    <LocalizedText source={"输入外语阅读材料，系统会生成练习题并进行内容检查。"} />
                  </p>
                </div>

                <div className="w-full relative group max-w-5xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--ube-400)] via-[var(--matcha-300)] to-[var(--lemon-400)] rounded-[48px] transform rotate-1 group-hover:rotate-2 transition-transform duration-700 opacity-60 blur-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--ube-400)] via-[var(--matcha-300)] to-[var(--lemon-400)] rounded-[48px] transform rotate-1 group-hover:rotate-2 transition-transform duration-700"></div>
                  <div className="relative rounded-[48px] overflow-hidden border-[6px] border-[var(--pure-white)] shadow-[0_30px_80px_rgba(0,0,0,0.2)] bg-[var(--oat-light)] transform transition-transform duration-700 group-hover:-translate-y-2">
                    <FeatureArtwork src={images.generateAi.src} />
                  </div>

                  {/* Floating badge 1 */}
                  <div className="absolute -bottom-8 right-4 md:-right-8 bg-[var(--pure-white)] border-2 border-[var(--oat-border)] p-4 md:p-5 rounded-[24px] md:rounded-[28px] shadow-2xl clay-hover transform -rotate-3 z-20 flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--ube-300)] flex items-center justify-center">
                      <MaterialIcon name="smart_toy" className="text-2xl md:text-3xl text-[var(--ube-800)]" />
                    </div>
                    <div className="text-left">
                      <p className="text-base md:text-lg font-bold text-[var(--clay-black)] leading-tight"><LocalizedText source={"Agentic Pipeline"} /></p>
                      <p className="text-xs md:text-sm text-[var(--warm-charcoal)]"><LocalizedText source={"Generasi & Self-Check"} /></p>
                    </div>
                  </div>

                  {/* Floating badge 2 */}
                  <div className="absolute -top-8 left-4 md:-left-8 bg-[var(--pure-white)] border-2 border-[var(--oat-border)] p-4 rounded-[24px] shadow-2xl clay-hover transform rotate-3 z-20 flex items-center gap-3 hidden md:flex">
                    <div className="w-12 h-12 rounded-full bg-[var(--lemon-400)] flex items-center justify-center">
                      <MaterialIcon name="verified" className="text-2xl text-[var(--lemon-800)]" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[var(--clay-black)] leading-tight"><LocalizedText source={"Kualitas Tinggi"} /></p>
                      <p className="text-xs text-[var(--warm-charcoal)]"><LocalizedText source={"Evaluasi Otomatis"} /></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2: Zigzag Right - Manajemen Paket */}
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                <div className="flex-1 w-full lg:w-1/2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--matcha-400)] to-[var(--lemon-400)] rounded-[40px] transform -rotate-3 group-hover:-rotate-6 transition-transform duration-700"></div>
                  <div className="relative rounded-[40px] overflow-hidden border-4 border-[var(--pure-white)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] transform transition-transform duration-700 group-hover:-translate-y-2 bg-[var(--oat-light)]">
                    <FeatureArtwork src={images.latihanSoal.src} />
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -top-6 -left-6 md:-left-10 bg-[var(--pure-white)] border-2 border-[var(--oat-border)] p-4 rounded-[24px] shadow-xl clay-hover transform rotate-6 z-20 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--matcha-300)] flex items-center justify-center">
                      <MaterialIcon name="source" className="text-2xl text-[var(--matcha-800)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--clay-black)] leading-tight"><LocalizedText source={"题库"} /></p>
                      <p className="text-xs text-[var(--warm-charcoal)]"><LocalizedText source={"Koleksi Lengkap"} /></p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full lg:w-1/2 space-y-6">
                  <h3 className="text-[40px] lg:text-[50px] font-headline font-semibold text-[var(--clay-black)] leading-[1.1] tracking-[-1.5px]">
                    <LocalizedText source={"Kustomisasi"} /> <br/> <span className="text-[var(--matcha-600)]"><LocalizedText source={"Paket Belajar"} /></span>
                  </h3>
                  <p className="text-xl text-[var(--warm-charcoal)] leading-relaxed">
                    <LocalizedText source={"Eksplorasi 题库 untuk merakit paket latihan Anda sendiri. Publikasikan paket soal buatan Anda, atau gunakan paket pilihan dari daftar Editor's Pick."} />
                  </p>
                  <ul className="space-y-4 pt-4">
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--matcha-300)]/50 flex items-center justify-center">
                        <MaterialIcon name="check" className="text-[var(--matcha-800)]" />
                      </div>
                      <span className="text-lg font-medium text-[var(--clay-black)]"><LocalizedText source={"题库 Terintegrasi"} /></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--matcha-300)]/50 flex items-center justify-center">
                        <MaterialIcon name="check" className="text-[var(--matcha-800)]" />
                      </div>
                      <span className="text-lg font-medium text-[var(--clay-black)]"><LocalizedText source={"Sistem Publikasi Paket"} /></span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 3: Zigzag Left - Simulasi */}
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-1 w-full lg:w-1/2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--slushie-500)] to-[var(--ube-400)] rounded-[40px] transform rotate-3 group-hover:rotate-6 transition-transform duration-700"></div>
                  <div className="relative rounded-[40px] overflow-hidden border-4 border-[var(--pure-white)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] transform transition-transform duration-700 group-hover:-translate-y-2 bg-[var(--oat-light)]">
                    <FeatureArtwork src={images.mocktest.src} />
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-6 -right-6 md:-right-10 bg-[var(--pure-white)] border-2 border-[var(--oat-border)] p-4 rounded-[24px] shadow-xl clay-hover transform -rotate-6 z-20 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--slushie-500)] flex items-center justify-center">
                      <MaterialIcon name="timer" className="text-2xl text-[var(--clay-black)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--clay-black)] leading-tight"><LocalizedText source={"Anti-Curang"} /></p>
                      <p className="text-xs text-[var(--warm-charcoal)]"><LocalizedText source={"Validasi Waktu"} /></p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full lg:w-1/2 space-y-6">
                  <h3 className="text-[40px] lg:text-[50px] font-headline font-semibold text-[var(--clay-black)] leading-[1.1] tracking-[-1.5px]">
                    <LocalizedText source={"模拟考试"} /> <br/> <span className="text-[var(--slushie-600)]"><LocalizedText source={"Fokus Penuh"} /></span>
                  </h3>
                  <p className="text-xl text-[var(--warm-charcoal)] leading-relaxed">
                    <LocalizedText source={"Kerjakan latihan dengan antarmuka ujian sesungguhnya. Selesaikan tes dengan sistem timer yang tervalidasi secara akurat, dan dapatkan kalkulasi skor serta akurasi secara instan."} />
                  </p>
                  <ul className="space-y-4 pt-4">
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--slushie-500)]/30 flex items-center justify-center">
                        <MaterialIcon name="check" className="text-[var(--clay-black)]" />
                      </div>
                      <span className="text-lg font-medium text-[var(--clay-black)]"><LocalizedText source={"Sistem Timer Tervalidasi"} /></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--slushie-500)]/30 flex items-center justify-center">
                        <MaterialIcon name="check" className="text-[var(--clay-black)]" />
                      </div>
                      <span className="text-lg font-medium text-[var(--clay-black)]"><LocalizedText source={"自动计算成绩"} /></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section id="features" className="w-full bg-[var(--pure-white)] py-32 border-y-2 border-dashed border-[var(--oat-border)]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center max-w-4xl mx-auto mb-24 space-y-6">
              <h2 className="text-[50px] md:text-[60px] font-headline font-semibold text-[var(--clay-black)] tracking-[-2.4px] leading-tight">
                <LocalizedText source={"核心功能"} />
              </h2>
              <p className="text-2xl text-[var(--warm-charcoal)]">
                <LocalizedText source={"从题目练习到成绩分析，帮助你把备考过程安排得更清晰。"} />
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="clay-shadow clay-hover bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[24px] overflow-hidden group p-4">
                <div className="h-56 w-full flex items-center justify-center p-2">
                  <img src={images.generateAi.src} alt={ui("AI Generator")} loading="lazy" className="h-full w-auto object-contain transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-lg" />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-headline text-[32px] font-semibold text-[var(--clay-black)] tracking-[-0.64px] mb-3 leading-tight">
                    <LocalizedText source={"AI Generator"} />
                  </h3>
                  <p className="text-[var(--warm-charcoal)] text-lg leading-relaxed">
                    <LocalizedText source={"使用 AI 按主题、难度和题型生成语言考试练习题。"} />
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="clay-shadow clay-hover bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[24px] overflow-hidden group p-4">
                <div className="h-56 w-full flex items-center justify-center p-2">
                  <img src={images.latihanSoal.src} alt={ui("Latihan Soal")} loading="lazy" className="h-full w-auto object-contain transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 drop-shadow-lg" />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-headline text-[32px] font-semibold text-[var(--clay-black)] tracking-[-0.64px] mb-3 leading-tight">
                    <LocalizedText source={"专项练习"} />
                  </h3>
                  <p className="text-[var(--warm-charcoal)] text-lg leading-relaxed">
                    <LocalizedText source={"从题库挑选题目并创建练习套题，针对薄弱环节进行训练。"} />
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="clay-shadow clay-hover bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[24px] overflow-hidden group p-4">
                <div className="h-56 w-full flex items-center justify-center p-2">
                  <img src={images.mocktest.src} alt={ui("Mock Test")} loading="lazy" className="h-full w-auto object-contain transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-lg" />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-headline text-[32px] font-semibold text-[var(--clay-black)] tracking-[-0.64px] mb-3 leading-tight">
                    <LocalizedText source={"模拟考试"} />
                  </h3>
                  <p className="text-[var(--warm-charcoal)] text-lg leading-relaxed">
                    <LocalizedText source={"在限时环境中完成模拟考试，并查看练习结果。"} />
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="clay-shadow clay-hover bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[24px] overflow-hidden group p-4">
                <div className="h-56 w-full flex items-center justify-center p-2">
                  <img src={images.progress.src} alt={ui("Progress Tracking")} loading="lazy" className="h-full w-auto object-contain transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 drop-shadow-lg" />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-headline text-[32px] font-semibold text-[var(--clay-black)] tracking-[-0.64px] mb-3 leading-tight">
                    <LocalizedText source={"学习分析"} />
                  </h3>
                  <p className="text-[var(--warm-charcoal)] text-lg leading-relaxed">
                    <LocalizedText source={"查看练习历史和各考试部分的成绩变化。"} />
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="clay-shadow clay-hover bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[24px] overflow-hidden group p-4">
                <div className="h-56 w-full flex items-center justify-center p-2">
                  <img src={images.vocabulary.src} alt={ui("Vocabulary")} loading="lazy" className="h-full w-auto object-contain transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-lg" />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-headline text-[32px] font-semibold text-[var(--clay-black)] tracking-[-0.64px] mb-3 leading-tight">
                    <LocalizedText source={"词汇训练"} />
                  </h3>
                  <p className="text-[var(--warm-charcoal)] text-lg leading-relaxed">
                    <LocalizedText source={"Perkaya kosakata Anda dengan metode cerdas dan pengulangan berkala yang dioptimalkan."} />
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="clay-shadow clay-hover bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[24px] overflow-hidden group p-4">
                <div className="h-56 w-full flex items-center justify-center p-2">
                  <img src={images.diskusi.src} alt={ui("Diskusi")} loading="lazy" className="h-full w-auto object-contain transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 drop-shadow-lg" />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-headline text-[32px] font-semibold text-[var(--clay-black)] tracking-[-0.64px] mb-3 leading-tight">
                    <LocalizedText source={"讨论与答疑"} />
                  </h3>
                  <p className="text-[var(--warm-charcoal)] text-lg leading-relaxed">
                    <LocalizedText source={"围绕难题交流思路，并查看题目解析。"} />
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>



        {/* SWATCH ROOM 1: Ube FAQ Section */}
        <section className="w-full bg-[var(--ube-800)] py-32 rounded-t-[40px] mt-[-40px] z-10 relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t-2 border-[var(--oat-border)]/20">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-16">
              <h2 className="text-[50px] md:text-[60px] font-headline font-semibold text-[var(--pure-white)] tracking-[-2.4px] mb-6 leading-tight drop-shadow-sm">
                <LocalizedText source={"常见问题"} />
              </h2>
              <p className="text-[var(--ube-300)] text-2xl max-w-2xl mx-auto">
                <LocalizedText source={"关于平台功能的常见问题。"} />
              </p>
            </div>

            <div className="bg-[var(--ube-900)]/40 backdrop-blur-sm border-2 border-[var(--ube-300)]/30 rounded-[32px] p-8 md:p-12 shadow-2xl">
              <FaqItem
                isDark
                question={ui("DUNCAN 是什么？")}
                answer={ui("DUNCAN 是一个外语考试练习平台，提供模拟考试、交互式题库和学习分析。")}
              />
              <FaqItem
                isDark
                question={ui("AI 出题如何使用？")}
                answer={ui("选择考试、主题和题型后，可以生成新的练习题。具体可用能力取决于当前配置的 AI 服务。")}
              />
              <FaqItem
                isDark
                question={ui("DUNCAN 完全免费吗？")}
                answer={ui("基础功能与 AI 生成功能的可用范围以实际部署配置为准。使用 AI 功能前，请先在设置中配置兼容的服务密钥。")}
              />
              <FaqItem
                isDark
                question={ui("支持哪些语言考试？")}
                answer={ui("题库覆盖 TOEFL、IELTS、TOEIC、JLPT、TOPIK、HSK 等多类语言考试，具体题目以题库内容为准。")}
              />
            </div>
          </div>
        </section>

        {/* SWATCH ROOM 2: Matcha CTA Section */}
        <section className="w-full bg-[var(--matcha-800)] py-40 px-6 rounded-t-[40px] mt-[-40px] z-20 relative shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t-2 border-[var(--matcha-600)]">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-[60px] md:text-[80px] font-headline font-semibold text-[var(--pure-white)] tracking-[-3.2px] leading-[0.95] drop-shadow-md">
              <LocalizedText source={"准备好开始练习了吗？"} />
            </h2>
            <p className="text-2xl text-[var(--matcha-300)] max-w-2xl mx-auto">
              <LocalizedText source={"注册后开始练习，逐步了解自己的备考进度。"} />
            </p>
            <div className="pt-8">
              <Link to="/login" className="inline-block">
                <Button className="bg-[var(--pure-white)] text-[var(--clay-black)] hover:bg-[var(--oat-light)] rounded-[24px] h-[80px] px-14 text-2xl font-bold clay-shadow clay-hover">
                  <LocalizedText source={"立即开始"} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[var(--pure-white)] py-12 border-t-2 border-[var(--oat-border)] text-center relative z-30">
        <p className="text-[var(--warm-charcoal)] font-semibold text-lg">
          &copy; {new Date().getFullYear()} <LocalizedText source={"DUNCAN · 外语考试练习"} />
        </p>
      </footer>
    </div>
  );
}
