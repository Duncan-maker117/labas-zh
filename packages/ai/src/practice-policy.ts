export const SUBJECTIVE_FORMATS = ["essay", "spoken_response"] as const;

export function isSubjectiveFormat(format: string) {
  return (SUBJECTIVE_FORMATS as readonly string[]).includes(format);
}

export function supportsSectionFormat(section: string, format: string) {
  if (section === "WRITING") return format === "essay";
  if (section === "SPEAKING") return format === "spoken_response";
  return !isSubjectiveFormat(format);
}

export function formatsForSection(section: string, formats: string[]) {
  return formats.filter((format) => supportsSectionFormat(section, format));
}

export function defaultSectionFormat(section: string) {
  return section === "WRITING" ? "essay" : section === "SPEAKING" ? "spoken_response" : "multiple_choice";
}

export function sectionMaterialInstruction(section: string) {
  if (section === "LISTENING") return "Write a natural spoken monologue or dialogue for audio playback. Use ordinary punctuation and plain spoken text, without stage directions, furigana, speaker labels or answers. Questions test information in this audio script.";
  if (section === "WRITING") return "Write a realistic writing assignment with the situation, audience and requirements. Generate essay questions. correctAnswer is a model response, not an exact-match answer; explanation describes assessment criteria. Do not put the model response in passageText or questionText.";
  if (section === "SPEAKING") return "Write a realistic speaking cue card with a topic and guiding points. Generate spoken_response questions. correctAnswer is a model spoken response; explanation describes content, organization, vocabulary and grammar criteria. Do not claim to assess pronunciation from text. Do not reveal the model response in the task.";
  return "Write an authentic reading passage appropriate to the selected exam and level.";
}
