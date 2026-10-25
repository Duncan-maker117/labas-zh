import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { responseAssessmentSchema } from "@labas/ai/assessment-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@labas/ui/components/card";
import { Button } from "@labas/ui/components/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@labas/ui/components/select";
import { useApiKeys } from "@/hooks/use-api-key";
import { useLocale } from "@/lib/locale";
import { trpc } from "@/utils/trpc";

interface ResponseItem { id: string; questionText: string; text: string }

export function SubjectiveAssessmentPanel({ attemptId, responses, onChanged }: { attemptId: string; responses: ResponseItem[]; onChanged: () => void }) {
  const { ui } = useLocale();
  const { configs } = useApiKeys();
  const [configId, setConfigId] = useState("platform");
  const [error, setError] = useState("");
  const evaluations = useQuery({ ...trpc.attempt.evaluations.queryOptions({ attemptId }), refetchInterval: (query) => query.state.data?.some((row) => row.status === "running") ? 2000 : false });
  const grade = useMutation({ ...trpc.attempt.evaluateResponse.mutationOptions(), onSuccess: () => { void evaluations.refetch(); onChanged(); }, onError: (failure) => { setError(ui(failure.message)); void evaluations.refetch(); } });
  const selected = configs.find((config) => config.id === configId);
  return <Card className="mb-8">
    <CardHeader><CardTitle>{ui("写作与口语批改")}</CardTitle></CardHeader>
    <CardContent className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">{ui("评分依据已保存的回答或转写文字，评价内容、组织、词汇和语法，不评价发音；分数仅供训练参考。")}</p>
      <Select value={configId} onValueChange={(value) => { if (value) setConfigId(value); }}>
        <SelectTrigger aria-label={ui("批改服务")}><SelectValue>{selected?.name ?? ui("平台 AI")}</SelectValue></SelectTrigger>
        <SelectContent><SelectGroup><SelectItem value="platform">{ui("平台 AI")}</SelectItem>{configs.map((config) => <SelectItem key={config.id} value={config.id}>{config.name}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
      {configId === "platform" && <p className="text-xs text-muted-foreground">{ui("每次平台批改最多预留 12000 AI 额度，完成后按实际用量结算，未用额度退回；失败可重试。")}</p>}
      {evaluations.isError && <p role="alert">{ui("无法加载批改记录，请确认服务已更新后重试。")}</p>}
      {responses.map((response) => {
        const record = evaluations.data?.find((item) => item.answerId === response.id);
        const parsed = responseAssessmentSchema.safeParse(record?.feedback);
        const stale = record?.status === "running" && Date.now() - new Date(record.updatedAt).getTime() >= 15 * 60 * 1000;
        const running = (record?.status === "running" && !stale) || (grade.isPending && grade.variables?.answerId === response.id);
        return <div key={response.id} className="flex flex-col gap-3 rounded-xl border p-4">
          <h3 className="font-semibold">{response.questionText}</h3>
          <p className="whitespace-pre-wrap text-sm">{response.text}</p>
          {record?.status === "completed" && parsed.success ? <>
            <p className="font-bold">{ui("训练参考分")}：{record.score} / 100</p>
            <div className="flex flex-wrap gap-3 text-sm">{Object.entries(parsed.data.criteria).map(([criterion, score]) => <span key={criterion}>{ui(({ task: "任务完成", organization: "结构组织", vocabulary: "词汇", grammar: "语法" } as Record<string, string>)[criterion])}：{score}</span>)}</div>
            <p className="whitespace-pre-wrap">{parsed.data.feedback}</p>
            <ul className="list-disc pl-5">{parsed.data.improvements.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul>
          </> : <Button type="button" className="min-h-11 rounded-xl px-5" disabled={running || grade.isPending || evaluations.isError || (configId !== "platform" && !selected)} onClick={() => {
            setError(""); grade.mutate({ answerId: response.id, apiKeyConfig: selected ? { baseUrl: selected.baseUrl, apiKey: selected.apiKey, model: selected.modelName, maxTokens: selected.maxTokens ?? 16384 } : undefined });
          }}>{ui(running ? "正在批改…" : record?.status === "failed" || stale ? "重试批改" : "AI 批改")}</Button>}
        </div>;
      })}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </CardContent>
  </Card>;
}
