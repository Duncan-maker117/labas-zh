import { EXAM_CATALOG, getExamFormats } from "./exam-catalog";
export const SUBJECTIVE_FORMATS = ["essay", "spoken_response"] as const;

export function isSubjectiveFormat(format: string) {
  return (SUBJECTIVE_FORMATS as readonly string[]).includes(format);
}

export function supportsSectionFormat(section: string, format: string, exam?: string, profile?: string) {
  if (exam && EXAM_CATALOG[exam]) return getExamFormats(exam, section, profile).includes(format);
  if (section === "WRITING") return ["essay", "fill_blank", "sentence_arrangement"].includes(format);
  if (section === "SPEAKING") return format === "spoken_response";
  return !isSubjectiveFormat(format);
}

export function formatsForSection(section: string, formats: string[], exam?: string, profile?: string) {
  return formats.filter((format) => supportsSectionFormat(section, format, exam, profile));
}

export function defaultSectionFormat(section: string, exam?: string, profile?: string) {
  if (exam && getExamFormats(exam, section, profile).length) return getExamFormats(exam, section, profile)[0]!;
  return section === "WRITING" ? "essay" : section === "SPEAKING" ? "spoken_response" : "multiple_choice";
}

export function sectionMaterialInstruction(section: string) {
  if (section === "LISTENING") return "Write a natural spoken monologue or dialogue for audio playback. Use ordinary punctuation and plain spoken text, without stage directions, furigana, speaker labels or answers. Questions test information in this audio script.";
  if (section === "WRITING") return "Write a realistic writing assignment with the situation, audience and requirements. Use essay for original written responses and the requested objective format for sentence building/completion. For essay, correctAnswer is a model response, not an exact-match answer, and explanation describes assessment criteria. For objective formats, correctAnswer must be the exact answer (word or ordered option keys). Do not put the answer in passageText or questionText.";
  if (section === "SPEAKING") return "Write a realistic speaking cue card with a topic and guiding points. Generate spoken_response questions. correctAnswer is a model spoken response; explanation describes content, organization, vocabulary and grammar criteria. Do not claim to assess pronunciation from text. Do not reveal the model response in the task.";
  return "Write an authentic reading passage appropriate to the selected exam and level.";
}
