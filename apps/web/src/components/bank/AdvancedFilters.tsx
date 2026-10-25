import { getExamFormats, getExamSections } from "@labas/ai/exam-catalog";
import { useLocale } from "@/lib/locale";
import { LocalizedText } from "@/components/ui/LocalizedText";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@labas/ui/components/select";
import { SECTIONS, FORMATS, DIFFICULTIES } from "@/lib/exam-constants";
import { difficultyLabel, formatLabel, sectionLabel } from "@/lib/format";

interface AdvancedFiltersProps {
  examType?: string;
  examProfile?: string;
  section: string;
  format: string;
  difficulty: number | undefined;
  onSetSection: (value: string) => void;
  onSetFormat: (value: string) => void;
  onSetDifficulty: (value: number | undefined) => void;
}

export function AdvancedFilters({
  examType = "",
  examProfile,
  section,
  format,
  difficulty,
  onSetSection,
  onSetFormat,
  onSetDifficulty,
}: AdvancedFiltersProps) {
  const { ui } = useLocale();
  const context = { examType, examProfile, section };
  const sections = examType ? getExamSections(examType, examProfile) : SECTIONS;
  const formats = examType ? getExamFormats(examType, section, examProfile) : FORMATS;
  return (
    <>
      <Select value={section} onValueChange={(v: string | null) => onSetSection(v ?? "")}>
        <SelectTrigger aria-label={ui("Section")} className="w-full md:w-38 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
          <SelectValue>{section ? sectionLabel(section, ui, context) : ui("Semua Section")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value=""><LocalizedText source={"Semua Section"} /></SelectItem>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.id}>{sectionLabel(s.id, ui, context)}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select value={format} onValueChange={(v: string | null) => onSetFormat(v ?? "")}>
        <SelectTrigger aria-label={ui("Format")} className="w-full md:w-56 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
          <SelectValue>{format ? formatLabel(format, ui, context) : ui("Semua Format")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value=""><LocalizedText source={"Semua Format"} /></SelectItem>
            {formats.map((f) => (
              <SelectItem key={f} value={f}>{formatLabel(f, ui, context)}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={difficulty !== undefined ? String(difficulty) : ""}
        onValueChange={(v: string | null) => onSetDifficulty(v ? Number(v) : undefined)}
      >
        <SelectTrigger aria-label={ui("Level")} className="w-full md:w-36 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
          <SelectValue>{difficulty !== undefined ? difficultyLabel(difficulty, ui) : ui("Semua Level")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value=""><LocalizedText source={"Semua Level"} /></SelectItem>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>{difficultyLabel(d.value, ui)}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
