import { useEffect, useRef, useState } from "react";
import { Button } from "@labas/ui/components/button";
import { useLocale } from "@/lib/locale";
import { examSpeechLanguage } from "@/lib/speech";

export function ListeningPlayer({ text, exam }: { text: string; exam: string }) {
  const { ui } = useLocale();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const language = examSpeechLanguage(exam);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update(); window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => { window.speechSynthesis.removeEventListener("voiceschanged", update); window.speechSynthesis.cancel(); };
  }, []);
  useEffect(() => { window.speechSynthesis?.cancel(); setPlaying(false); setError(""); }, [text]);
  const voice = voices.find((item) => item.lang.toLowerCase() === language.toLowerCase()) ?? voices.find((item) => item.lang.toLowerCase().startsWith(language.split("-")[0]));
  const play = () => {
    if (!voice) { setError(ui("当前浏览器没有此语言的语音，请安装对应语音或换用支持该语言的浏览器。")); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = voice; speech.lang = language;
    speech.onstart = () => setPlaying(true);
    speech.onend = () => setPlaying(false);
    speech.onerror = (event) => { setPlaying(false); if (!["canceled", "interrupted"].includes(event.error)) setError(ui("语音播放失败，请重试或检查浏览器语音设置。")); };
    utterance.current = speech;
    setError(""); window.speechSynthesis.speak(speech);
  };
  return <div className="flex flex-col gap-4" aria-label={ui("听力材料")}>
    <p>{ui("先听材料，再回答右侧题目。提交练习后可查看文字材料。")}</p>
    <div className="flex gap-3">
      <Button type="button" className="min-h-11 rounded-xl px-5" onClick={play} disabled={playing}>{ui(playing ? "正在播放…" : "播放听力材料")}</Button>
      <Button type="button" variant="outline" className="min-h-11 rounded-xl border px-5" disabled={!playing} onClick={() => { window.speechSynthesis.cancel(); setPlaying(false); }}>{ui("停止播放")}</Button>
    </div>
    <p className="text-sm text-muted-foreground">{ui("使用浏览器语音合成播放，非真人录音。")}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
