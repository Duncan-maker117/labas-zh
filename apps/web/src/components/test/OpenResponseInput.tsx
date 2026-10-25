import { useEffect, useRef, useState } from "react";
import { Button } from "@labas/ui/components/button";
import { useLocale } from "@/lib/locale";
import { examSpeechLanguage, speechRecognitionConstructor, type SpeechRecognitionSession } from "@/lib/speech";

export function OpenResponseInput({ spoken, exam, value, onChange, disabled }: { spoken: boolean; exam: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const { ui } = useLocale();
  const [recording, setRecording] = useState(false);
  const [acquiring, setAcquiring] = useState(false);
  const [audio, setAudio] = useState("");
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recognition = useRef<SpeechRecognitionSession | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const enabled = useRef(!disabled); enabled.current = !disabled;
  const change = useRef(onChange); change.current = onChange;
  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    recognition.current?.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    clearTimeout(timeout.current); setRecording(false);
  };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; recognition.current?.abort(); if (recorder.current?.state === "recording") recorder.current.stop(); stream.current?.getTracks().forEach((track) => track.stop()); clearTimeout(timeout.current); }; }, []);
  useEffect(() => () => { if (audio) URL.revokeObjectURL(audio); }, [audio]);
  useEffect(() => { if (disabled) stop(); }, [disabled]);
  const start = async () => {
    if (acquiring || recording) return;
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError(ui("当前浏览器不支持录音，请使用支持麦克风的浏览器和 HTTPS 或本地地址。")); return; }
    setAcquiring(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.current = media;
      if (!mounted.current || !enabled.current) { media.getTracks().forEach((track) => track.stop()); return; }
      const capture = new MediaRecorder(media); recorder.current = capture;
      const chunks: Blob[] = [];
      capture.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      capture.onstop = () => { if (mounted.current) { setAudio(URL.createObjectURL(new Blob(chunks, { type: capture.mimeType || "audio/webm" }))); setRecording(false); } media.getTracks().forEach((track) => track.stop()); };
      const Recognizer = speechRecognitionConstructor();
      if (Recognizer) {
        const session = new Recognizer(); recognition.current = session;
        session.lang = examSpeechLanguage(exam); session.continuous = true; session.interimResults = false;
        const before = value.trim(); const parts: string[] = [];
        session.onresult = (event) => {
          if (!mounted.current || !enabled.current) return;
          for (let index = event.resultIndex; index < event.results.length; index++) if (event.results[index].isFinal) parts.push(event.results[index][0].transcript);
          change.current([before, ...parts].filter(Boolean).join(" ").slice(0, 12000));
        };
        session.onerror = () => setError(ui("自动转写不可用；录音仍可回放，请核对并填写转写文字后提交。"));
        try { session.start(); } catch { setError(ui("自动转写不可用；录音仍可回放，请核对并填写转写文字后提交。")); }
      } else setError(ui("自动转写不可用；录音仍可回放，请核对并填写转写文字后提交。"));
      capture.start(); setRecording(true); timeout.current = setTimeout(stop, 120000);
    } catch { recognition.current?.abort(); stream.current?.getTracks().forEach((track) => track.stop()); setError(ui("无法访问麦克风，请允许录音权限后重试。")); }
    finally { if (mounted.current) setAcquiring(false); }
  };
  return <div className="flex flex-col gap-3">
    {spoken && <>
      <div className="flex gap-3"><Button type="button" className="min-h-11 rounded-xl px-5" disabled={disabled || recording || acquiring} onClick={start}>{ui("开始录音")}</Button><Button type="button" variant="outline" className="min-h-11 rounded-xl border px-5" disabled={!recording} onClick={stop}>{ui("停止录音")}</Button></div>
      {recording && <p role="status">{ui("正在录音，最长两分钟…")}</p>}
      {audio && <audio controls src={audio} aria-label={ui("录音回放")} />}
      <p className="text-xs text-muted-foreground">{ui("录音仅在当前页面回放；提交并保存的是转写文字。AI 评价内容与语言，不评价发音。")}</p>
    </>}
    <textarea value={value} onChange={(event) => onChange(event.target.value)} maxLength={12000} disabled={disabled || recording} aria-label={ui(spoken ? "口语转写内容" : "写作答案")} placeholder={ui(spoken ? "核对转写文字后提交，可手动修正。" : "在这里输入你的完整回答…")} className="min-h-56 w-full rounded-lg border bg-background p-3 text-sm disabled:opacity-50" />
    <p className="text-xs text-muted-foreground">{value.length.toLocaleString()} / 12000 {ui("字符")}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
