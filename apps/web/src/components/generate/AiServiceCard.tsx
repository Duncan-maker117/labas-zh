import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@labas/ui/components/card";
import { Button } from "@labas/ui/components/button";
import { Checkbox } from "@labas/ui/components/checkbox";
import { Skeleton } from "@labas/ui/components/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@labas/ui/components/select";
import { useLocale } from "@/lib/locale";
import { aiServiceCopy } from "@/lib/ai-service-copy";
import type { ApiKeyConfig } from "@/hooks/use-api-key";

interface AiServiceCardProps {
  usePlatform: boolean;
  onUsePlatformChange: (value: boolean) => void;
  configs: ApiKeyConfig[];
  selectedKeyId: string;
  onSelectKey: (value: string) => void;
  balance: number;
  reserved: number;
  requiredAllowance: number;
  issue: string | null;
  isLoading: boolean;
  onRetry: () => void;
}

export function AiServiceCard(props: AiServiceCardProps) {
  const { locale } = useLocale();
  const text = aiServiceCopy(locale);
  const selected = props.configs.find((config) => config.id === props.selectedKeyId);
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {props.usePlatform && (
          <div aria-live="polite" className="flex flex-col gap-2">
            {props.isLoading ? <><span>{text.loading}</span><Skeleton className="h-6 w-32" /></> : (
              <>
                <p>{text.balance}：<strong>{props.balance.toLocaleString(locale)}</strong> {text.units}</p>
                {props.reserved > 0 && <p className="text-sm text-muted-foreground">{text.reserved}：{props.reserved.toLocaleString(locale)}</p>}
                <p className="text-sm text-muted-foreground">{text.estimate}：{props.requiredAllowance.toLocaleString(locale)} {text.units}</p>
                {props.issue && <p role="status" className="text-sm text-destructive">{props.issue}</p>}
                {props.issue === text.loadError && <Button variant="outline" onClick={props.onRetry}>{text.retry}</Button>}
              </>
            )}
          </div>
        )}
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">{text.advanced}</summary>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2">
              <Checkbox checked={!props.usePlatform} onCheckedChange={(checked) => props.onUsePlatformChange(!checked)} />
              {text.ownKey}
            </label>
            {!props.usePlatform && (
              <>
                {props.configs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="personal-ai-config">{text.keyLabel}</label>
                    <Select value={props.selectedKeyId} onValueChange={(value) => { if (value) props.onSelectKey(value); }}>
                      <SelectTrigger id="personal-ai-config"><SelectValue>{selected ? `${selected.name} · ${selected.modelName}` : text.chooseKey}</SelectValue></SelectTrigger>
                      <SelectContent><SelectGroup>{props.configs.map((config) => <SelectItem key={config.id} value={config.id}>{config.name} · {config.modelName}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                  </div>
                ) : <p role="status" className="text-sm">{text.missingKey}</p>}
                <Link to="/settings" search={{ tab: "api-keys" }} className="text-sm underline">{text.manage}</Link>
              </>
            )}
          </div>
        </details>
      </CardContent>
      <CardFooter><p className="text-sm text-muted-foreground">{text.settlement}</p></CardFooter>
    </Card>
  );
}
