import { useLocale } from "@/lib/locale";
import { LocalizedText } from "@/components/ui/LocalizedText";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@labas/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@labas/ui/components/select";
import { Button } from "@labas/ui/components/button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SECTIONS, FORMATS, DIFFICULTIES } from "@/lib/exam-constants";
import { difficultyLabel, formatLabel, sectionLabel } from "@/lib/format";

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: string;
  format: string;
  difficulty: number | undefined;
  activeChips: FilterChip[];
  onSetSection: (value: string) => void;
  onSetFormat: (value: string) => void;
  onSetDifficulty: (value: number | undefined) => void;
  onClearFilters: () => void;
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  section,
  format,
  difficulty,
  activeChips,
  onSetSection,
  onSetFormat,
  onSetDifficulty,
  onClearFilters,
}: MobileFilterSheetProps) {
  const { ui } = useLocale();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] rounded-t-2xl bg-[var(--pure-white)] border-t-2 border-[var(--oat-border)] px-4 pb-6"
        showCloseButton
      >
        <SheetHeader>
          <SheetTitle className="text-base font-bold text-[var(--clay-black)]"><LocalizedText source={"Filter Lanjutan"} /></SheetTitle>
          <SheetDescription className="text-xs text-[var(--warm-charcoal)]">
            <LocalizedText source={"Sesuaikan pencarian soal Anda"} />
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-[var(--warm-charcoal)] mb-1.5 uppercase"><LocalizedText source={"Section"} /></label>
            <Select value={section} onValueChange={(v: string | null) => onSetSection(v ?? "")}>
              <SelectTrigger aria-label={ui("Section")} className="w-full rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
                <SelectValue>{section ? sectionLabel(section, ui) : ui("Semua Section")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value=""><LocalizedText source={"Semua Section"} /></SelectItem>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{sectionLabel(s.id, ui)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--warm-charcoal)] mb-1.5 uppercase"><LocalizedText source={"Format"} /></label>
            <Select value={format} onValueChange={(v: string | null) => onSetFormat(v ?? "")}>
              <SelectTrigger aria-label={ui("Format")} className="w-full rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
                <SelectValue>{format ? formatLabel(format, ui) : ui("Semua Format")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value=""><LocalizedText source={"Semua Format"} /></SelectItem>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>{formatLabel(f, ui)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--warm-charcoal)] mb-1.5 uppercase"><LocalizedText source={"Level"} /></label>
            <Select
              value={difficulty !== undefined ? String(difficulty) : ""}
              onValueChange={(v: string | null) => onSetDifficulty(v ? Number(v) : undefined)}
            >
              <SelectTrigger aria-label={ui("Level")} className="w-full rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] h-11 cursor-pointer">
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
          </div>
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--oat-border)]">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--clay-black)] text-[var(--pure-white)] text-xs font-medium cursor-pointer"
                >
                  {chip.label}
                  <MaterialIcon name="close" className="text-xs" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-4 border-t border-[var(--oat-border)]">
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] font-bold text-sm h-11 cursor-pointer"
          >
            <LocalizedText source={"Terapkan"} />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onClearFilters();
              onOpenChange(false);
            }}
            className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] h-11 cursor-pointer"
          >
            <LocalizedText source={"Reset"} />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
