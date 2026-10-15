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
import { formatLabel } from "@/lib/format";

interface AdvancedFiltersProps {
  section: string;
  format: string;
  difficulty: number | undefined;
  onSetSection: (value: string) => void;
  onSetFormat: (value: string) => void;
  onSetDifficulty: (value: number | undefined) => void;
}

export function AdvancedFilters({
  section,
  format,
  difficulty,
  onSetSection,
  onSetFormat,
  onSetDifficulty,
}: AdvancedFiltersProps) {
  const { ui } = useLocale();
  return (
    <>
      <Select value={section} onValueChange={(v: string | null) => onSetSection(v ?? "")}>
        <SelectTrigger className="w-full md:w-38 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
          <SelectValue placeholder={ui("Section")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value=""><LocalizedText source={"Semua Section"} /></SelectItem>
            {SECTIONS.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select value={format} onValueChange={(v: string | null) => onSetFormat(v ?? "")}>
        <SelectTrigger className="w-full md:w-40 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
          <SelectValue placeholder={ui("Format")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value=""><LocalizedText source={"Semua Format"} /></SelectItem>
            {FORMATS.map((f) => (
              <SelectItem key={f} value={f}>{formatLabel(f)}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={difficulty !== undefined ? String(difficulty) : ""}
        onValueChange={(v: string | null) => onSetDifficulty(v ? Number(v) : undefined)}
      >
        <SelectTrigger className="w-full md:w-36 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
          <SelectValue placeholder={ui("Level")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value=""><LocalizedText source={"Semua Level"} /></SelectItem>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
