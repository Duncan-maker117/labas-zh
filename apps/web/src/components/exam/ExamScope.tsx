import { EXAM_CATALOG, getExamProfile, getExamSections } from "@labas/ai/exam-catalog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@labas/ui/components/select";
import { useLocale } from "@/lib/locale";

export function ExamScope({ examType, profile, onProfileChange, sections }: { examType: string; profile?: string; onProfileChange: (value: string) => void; sections?: string[] }) {
  const { ui } = useLocale();
  const spec = EXAM_CATALOG[examType];
  if (!spec) return null;
  const selected = getExamProfile(examType, profile)!;
  const skills = getExamSections(examType, selected.id).filter((item) => !sections?.length || sections.includes(item.id));
  return <div data-testid="exam-scope" className="flex flex-col gap-3 rounded-xl border bg-background p-4 text-sm">
    <div className="flex flex-wrap items-center gap-3">
      {spec.profiles.length > 1 && <Select value={selected.id} onValueChange={(value) => { if (value) onProfileChange(value); }}>
        <SelectTrigger aria-label={ui("考试级别 / 分卷")} className="w-full sm:w-56"><SelectValue>{ui(selected.name)}</SelectValue></SelectTrigger>
        <SelectContent><SelectGroup>{spec.profiles.map((item) => <SelectItem key={item.id} value={item.id}>{ui(item.name)}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>}
      <p className="flex-1 text-muted-foreground">{ui(spec.note)}</p>
      <a className="underline underline-offset-4" href={spec.sources[0]} target="_blank" rel="noreferrer">{ui("官方考试说明")}</a>
    </div>
    <details className="text-muted-foreground"><summary className="cursor-pointer">{ui("查看考试内容与练习范围")}</summary><div className="mt-3 flex flex-col gap-2">{skills.map((item) => <p key={item.id}><span className="font-medium text-foreground">{ui(item.name)}：</span>{ui(item.content)}</p>)}</div></details>
  </div>;
}
