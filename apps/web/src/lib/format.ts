import { getExamFormatLabel, getExamSections } from "@labas/ai/exam-catalog";
import { DIFFICULTIES, FORMATS } from "./generate-constants";
import { PRACTICE_SECTIONS } from "./subject-constants";

type Translate = (source: string) => string;
type ExamContext = { examType?: string; examProfile?: string; section?: string };
const identity: Translate = (source) => source;

export function formatLabel(fmt: string, translate: Translate = identity, context?: ExamContext) {
  const contextual = context?.examType ? getExamFormatLabel(context.examType, fmt, context.section, context.examProfile) : undefined;
  const name = contextual ?? FORMATS.find((format) => format.id === fmt)?.name;
  return translate(name ?? fmt.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
}

export function sectionLabel(section: string, translate: Translate = identity, context?: ExamContext) {
  const contextual = context?.examType ? getExamSections(context.examType, context.examProfile).find((item) => item.id === section.toUpperCase()) : undefined;
  const match = PRACTICE_SECTIONS.find((item) =>
    item.id === section.toUpperCase() || item.name.toLowerCase() === section.toLowerCase(),
  );
  return translate(contextual?.name ?? match?.name ?? section);
}

export function difficultyLabel(level: number, translate: Translate = identity) {
  return translate(DIFFICULTIES[level - 1] ?? `${translate("Level")} ${level}`);
}
