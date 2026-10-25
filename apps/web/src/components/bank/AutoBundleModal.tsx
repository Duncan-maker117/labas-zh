import { useLocale } from "@/lib/locale";
import { useEffect, useState } from "react";
import { Input } from "@labas/ui/components/input";
import { Button } from "@labas/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@labas/ui/components/dialog";

type BundleInput = { title: string; description: string; isPublic: boolean; count: number; sortOrder: "random" | "difficulty" };
interface Props {
  availableCount: number;
  examTypeName: string;
  sectionTypeName: string;
  scopeDescription?: string;
  onClose: () => void;
  onCreate: (data: BundleInput) => void;
  onGenerate?: () => void;
  onRelaxFilters?: () => void;
  onShowMine?: () => void;
  isPending: boolean;
  isLoading?: boolean;
  isError?: boolean;
}

export function AutoBundleModal({ availableCount, examTypeName, sectionTypeName, scopeDescription, onClose, onCreate, onGenerate, onRelaxFilters, onShowMine, isPending, isLoading, isError }: Props) {
  const { ui, locale } = useLocale();
  const [count, setCount] = useState(Math.min(availableCount, 10));
  const [title, setTitle] = useState(() => `${examTypeName} ${sectionTypeName} ${ui("练习套题")} · ${new Date().toLocaleDateString(locale)}`);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [sortOrder, setSortOrder] = useState<"random" | "difficulty">("random");
  useEffect(() => { setCount((previous) => availableCount > 0 ? (previous > 0 ? Math.min(previous, availableCount) : Math.min(availableCount, 10)) : 0); }, [availableCount]);
  const ready = !isLoading && !isError && availableCount > 0;
  return <Dialog open onOpenChange={(open) => { if (!open && !isPending) onClose(); }}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{ui("自动组卷")}</DialogTitle>
        <DialogDescription>{ui("从已有题库选题创建练习套题，不会生成新题目。")}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 text-sm">
        <p className="font-medium">{examTypeName} · {sectionTypeName}</p>
        <p className="text-muted-foreground">{scopeDescription}</p>
        <p role="status">{isLoading ? ui("正在统计可用题目…") : isError ? ui("题目数量读取失败，请关闭后重试。") : `${availableCount} ${ui("道可用题目")}`}</p>
      </div>
      {!isLoading && !isError && availableCount === 0 && <section aria-label={ui("暂无可用题目")} className="flex flex-col gap-3">
        <p>{ui("当前条件下没有可组卷的已有题目。请先生成题目，或调整筛选范围。")}</p>
        {onShowMine && <p className="text-sm text-muted-foreground">{ui("AI 生成的题目默认在“我的题目”中，未公开前不会出现在公开题库。")}</p>}
        <div className="flex flex-wrap gap-2">
          {onGenerate && <Button size="xl" onClick={onGenerate}>{ui("去生成题目")}</Button>}
          {onRelaxFilters && <Button size="xl" variant="outline" onClick={onRelaxFilters}>{ui("放宽筛选")}</Button>}
          {onShowMine && <Button size="xl" variant="outline" onClick={onShowMine}>{ui("查看我的题目")}</Button>}
        </div>
      </section>}
      {ready && <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2" htmlFor="auto-bundle-title">{ui("Judul Paket")}<Input id="auto-bundle-title" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="flex flex-col gap-2" htmlFor="auto-bundle-description">{ui("Deskripsi")}<Input id="auto-bundle-description" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="flex flex-col gap-2" htmlFor="auto-bundle-count">{ui("题目数量")}<Input id="auto-bundle-count" type="number" min={1} max={availableCount} value={count} onChange={(event) => setCount(Number(event.target.value))} /></label>
        <label className="flex flex-col gap-2" htmlFor="auto-bundle-order">{ui("Urutan Soal")}<select id="auto-bundle-order" className="min-h-11 rounded-lg border bg-background px-3" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "random" | "difficulty")}><option value="random">{ui("Acak")}</option><option value="difficulty">{ui("Difficulty")}</option></select></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />{ui("Publikasikan ke Bank Soal")}</label>
      </div>}
      <div className="flex gap-3">
        <Button size="xl" variant="outline" onClick={onClose} disabled={isPending}>{ui("Batal")}</Button>
        {ready && <Button size="xl" disabled={!title.trim() || isPending || !Number.isInteger(count) || count < 1 || count > availableCount} onClick={() => onCreate({ title, description, isPublic, count, sortOrder })}>{ui(isPending ? "Membuat..." : "Buat Paket")}</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
