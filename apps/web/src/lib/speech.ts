export function examSpeechLanguage(exam: string) {
  return ({ IELTS: "en-GB", TOEFL: "en-US", JLPT: "ja-JP", HSK: "zh-CN", GOETHE: "de-DE", TOPIK: "ko-KR", TOAFL: "ar-SA", DELE: "es-ES" } as Record<string, string>)[exam] ?? "en-US";
}

export interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } };
}
export interface SpeechRecognitionSession {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export function speechRecognitionConstructor() {
  const speechWindow = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionSession; webkitSpeechRecognition?: new () => SpeechRecognitionSession };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}
