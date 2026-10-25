/** Official skill scopes mapped to the response formats this application can practice.
 * Keep stored exam/section/format IDs stable; these are practice shapes, not full official papers.
 * Reviewed 2026-10-25. Sources are exposed in the UI and recorded in the acceptance log.
 */
export interface ExamSectionSpec {
  id: string;
  name: string;
  formats: readonly string[];
  content: string;
  labels?: Record<string, string>;
}
export interface ExamProfile {
  id: string;
  name: string;
  sections: readonly ExamSectionSpec[];
}
export interface ExamSpec {
  note: string;
  sources: readonly string[];
  profiles: readonly ExamProfile[];
}
const section = (id: string, formats: string[], content: string, labels?: Record<string, string>, name?: string): ExamSectionSpec => ({ id, name: name ?? ({ READING: "Reading", LISTENING: "Listening", WRITING: "Writing", SPEAKING: "Speaking" }[id] ?? id), formats, content, labels });
const writing = section("WRITING", ["essay"], "Written expression and interaction.");
const speaking = section("SPEAKING", ["spoken_response"], "Spoken expression and interaction.");
const fourSkills = (reading: string[], listening: string[]) => [section("READING", reading, "Reading comprehension and language use."), section("LISTENING", listening, "Conversations, announcements and talks."), writing, speaking];
const topikReading = section("READING", ["multiple_choice", "grammar_in_context", "sentence_arrangement"], "Vocabulary, grammar and reading comprehension; objective questions.");
const topikListening = section("LISTENING", ["multiple_choice"], "Listen to dialogues and talks and choose the answer.");
const hskReading = section("READING", ["multiple_choice", "matching_pairs", "fill_blank"], "Read words, sentences and passages at the selected HSK level.");
const hskListening = section("LISTENING", ["multiple_choice"], "Listen to words, dialogues and passages at the selected HSK level.");

export const EXAM_CATALOG: Record<string, ExamSpec> = {
  TOEFL: {
    note: "TOEFL iBT: format effective from 21 January 2026. Reading, listening, writing and speaking have different tasks.",
    sources: ["https://www.ets.org/toefl/test-takers/ibt/about/content.html"],
    profiles: [{ id: "toefl_2026", name: "TOEFL iBT 2026", sections: [
      section("READING", ["multiple_choice", "fill_blank"], "Complete the Words; Read in Daily Life; Read an Academic Passage.", { multiple_choice: "Daily-life / academic reading", fill_blank: "Complete the Words" }),
      section("LISTENING", ["multiple_choice"], "Listen and Choose a Response; Conversation; Announcement; Academic Talk.", { multiple_choice: "Listening comprehension / choose a response" }),
      section("WRITING", ["essay", "sentence_arrangement"], "Build a Sentence; Write an Email; Write for an Academic Discussion.", { essay: "Email / academic discussion", sentence_arrangement: "Build a Sentence" }),
      section("SPEAKING", ["spoken_response"], "Listen and Repeat; Take an Interview. Text assessment does not measure pronunciation.", { spoken_response: "Repeat / interview response" }),
    ] }],
  },
  IELTS: {
    note: "IELTS Academic has four skills. Reading includes True/False/Not Given; listening uses different question types.",
    sources: ["https://ielts.org/take-a-test/test-types/ielts-academic-test", "https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening"],
    profiles: [{ id: "ielts_academic", name: "IELTS Academic", sections: [
      section("READING", ["multiple_choice", "true_false_not_given", "author_view", "matching_headings", "matching_information", "matching_pairs", "sentence_completion", "summary_completion", "fill_blank"], "Multiple choice; identifying information and views; matching; completion tasks."),
      section("LISTENING", ["multiple_choice", "matching_pairs", "fill_blank", "sentence_completion"], "Multiple choice; matching; form, note and sentence completion. Image-labelling tasks need suitable visual material."),
      section("WRITING", ["essay"], "Academic Task 1 describes visual information; Task 2 develops an argument.", { essay: "Academic report / argument essay" }),
      section("SPEAKING", ["spoken_response"], "Part 1 interview; Part 2 individual long turn; Part 3 discussion.", { spoken_response: "Interview / long turn / discussion" }),
    ] }],
  },
  JLPT: {
    note: "JLPT assesses language knowledge, reading and listening. It has no writing or speaking test. Test blocks differ by level.",
    sources: ["https://www.jlpt.jp/e/guideline/testsections.html"],
    profiles: ["N3", "N5", "N4", "N2", "N1"].map((level) => ({ id: `jlpt_${level.toLowerCase()}`, name: `JLPT ${level}`, sections: [
      section("READING", ["multiple_choice", "kanji_reading", "synonym", "particle_choice", "grammar_in_context", "sentence_arrangement", "cloze"], "Kanji and vocabulary; grammar choice and sentence composition; reading comprehension.", undefined, "Language knowledge & reading"),
      section("LISTENING", ["multiple_choice"], "Task-based comprehension, key points and quick responses; available tasks differ by level."),
    ] })),
  },
  HSK: {
    note: "HSK 1–2: listening and reading; HSK 3–6: also writing. HSKK is a separate oral test. HSK 7–9 adds translation and is not offered as a complete paper here. HSK 3.0 is announced for 13 December 2026.",
    sources: ["https://www.chinesetest.cn/userfiles/file/HSKbyWord.pdf", "https://www.chinesetest.cn/HSK/7-9", "https://old.chinesetest.cn/gonewcontent.do?flag=kdnew&id=51336883"],
    profiles: [
      ...["3", "4", "5", "6", "1", "2"].map((level) => ({ id: `hsk_${level}`, name: `HSK ${level}`, sections: [hskReading, hskListening, ...(Number(level) >= 3 ? [section("WRITING", Number(level) <= 4 ? ["fill_blank", "sentence_arrangement"] : level === "5" ? ["essay", "sentence_arrangement"] : ["essay"], "Complete or arrange sentences at lower levels; produce written responses at higher levels.")] : [])] })),
      { id: "hskk", name: "HSKK oral test", sections: [section("SPEAKING", ["spoken_response"], "HSKK oral practice: repetition, retelling and responses as appropriate to the chosen level.", { spoken_response: "HSKK oral response" })] },
    ],
  },
  GOETHE: {
    note: "Goethe-Zertifikat assesses reading, listening, writing and speaking. Task design and module organization differ by level.",
    sources: ["https://www.goethe.de/en/spr/prf/ueb.html"],
    profiles: ["B1", "A1", "A2", "B2", "C1", "C2"].map((level) => ({ id: `goethe_${level.toLowerCase()}`, name: `Goethe ${level}`, sections: fourSkills(["multiple_choice", "matching_information", "matching_pairs", "fill_blank"], ["multiple_choice", "matching_pairs"]) })),
  },
  TOPIK: {
    note: "TOPIK I has listening and reading; TOPIK II adds writing. TOPIK Speaking is a separate test.",
    sources: ["https://www.studyinkorea.go.kr/ko/plan/examAndKoreanStudy.do"],
    profiles: [
      { id: "topik_i", name: "TOPIK I", sections: [topikReading, topikListening] },
      { id: "topik_ii", name: "TOPIK II", sections: [topikReading, topikListening, section("WRITING", ["essay", "fill_blank"], "Complete short written texts, describe data and write an extended response.")] },
      { id: "topik_speaking", name: "TOPIK Speaking", sections: [speaking] },
    ],
  },
  TOAFL: {
    note: "TOAFL content varies by institution. This practice scope follows UIN Jakarta: listening, language structures and reading; it is not a universal four-skill exam.",
    sources: ["https://repository.uinjkt.ac.id/dspace/bitstream/123456789/28457/3/MUHBIB%20ABDUL%20WAHAB-FITK.pdf"],
    profiles: [{ id: "toafl_uin", name: "TOAFL · UIN Jakarta", sections: [
      section("READING", ["multiple_choice", "grammar_in_context", "sentence_completion", "error_recognition"], "Reading comprehension; sentence structures and expressions; identifying errors.", undefined, "Reading & language structures"),
      section("LISTENING", ["multiple_choice"], "Arabic listening comprehension."),
    ] }],
  },
  DELE: {
    note: "DELE tasks depend on level. These are reading, listening, written and oral practice skills; C1/C2 also use integrated tasks, not four identical standalone papers.",
    sources: ["https://examenes.cervantes.es/es/dele/examenes/b2", "https://berlin.cervantes.es/es/diplomas_espanol_dele/formato_niveles_examen_dele.htm"],
    profiles: ["B2", "A1", "A2", "B1", "C1", "C2"].map((level) => ({ id: `dele_${level.toLowerCase()}`, name: `DELE ${level}`, sections: fourSkills(["multiple_choice", "matching_pairs", "matching_information", "cloze"], ["multiple_choice", "matching_pairs"]) })),
  },
};

export function getExamProfile(exam: string, profile?: string) {
  const profiles = EXAM_CATALOG[exam]?.profiles ?? [];
  return profiles.find((item) => item.id === profile) ?? profiles[0];
}
export function getExamSections(exam: string, profile?: string): readonly ExamSectionSpec[] {
  return getExamProfile(exam, profile)?.sections ?? [];
}
export function getExamFormats(exam: string, sectionId?: string, profile?: string): string[] {
  return [...new Set(getExamSections(exam, profile).filter((s) => !sectionId || s.id === sectionId).flatMap((s) => s.formats))];
}
export function getExamFormatLabel(exam: string, format: string, sectionId?: string, profile?: string) {
  return sectionId ? getExamSections(exam, profile).find((s) => s.id === sectionId)?.labels?.[format] : undefined;
}
export function examGenerationInstruction(exam: string, sectionId: string, profile?: string) {
  const selected = getExamProfile(exam, profile);
  const skill = selected?.sections.find((s) => s.id === sectionId);
  return skill ? `Exam profile: ${selected!.name}. Official content scope: ${skill.content} Only generate the requested response formats; these are practice tasks, not a full official or adaptive test.` : "";
}
