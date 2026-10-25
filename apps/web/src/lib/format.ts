import { DIFFICULTIES, FORMATS } from "./generate-constants";
import { PRACTICE_SECTIONS } from "./subject-constants";

type Translate = (source: string) => string;
const identity: Translate = (source) => source;

export function formatLabel(fmt: string, translate: Translate = identity) {
  const name = FORMATS.find((format) => format.id === fmt)?.name;
  return translate(name ?? fmt.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
}

export function sectionLabel(section: string, translate: Translate = identity) {
  const match = PRACTICE_SECTIONS.find((item) =>
    item.id === section.toUpperCase() || item.name.toLowerCase() === section.toLowerCase(),
  );
  return translate(match?.name ?? section);
}

export function difficultyLabel(level: number, translate: Translate = identity) {
  return translate(DIFFICULTIES[level - 1] ?? `${translate("Level")} ${level}`);
}
