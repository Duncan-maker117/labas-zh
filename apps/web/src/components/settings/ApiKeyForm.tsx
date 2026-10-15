import { useLocale } from "@/lib/locale";
import { LocalizedText, LocalizedValue } from "@/components/ui/LocalizedText";
import { type ApiKeyConfig } from "@/hooks/use-api-key";
import { Button } from "@labas/ui/components/button";
import { Input } from "@labas/ui/components/input";
import { Label } from "@labas/ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@labas/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@labas/ui/components/select";

type FormState = Omit<ApiKeyConfig, "id"> & { apiKey: string };

interface ProviderOption {
  value: string;
  label: string;
}

interface ApiKeyFormProps {
  isAdding: boolean;
  isSaving: boolean;
  form: FormState;
  canSave: boolean;
  providers: ProviderOption[];
  onChange: (field: keyof FormState, value: string | number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ApiKeyForm({ isAdding, isSaving, form, canSave, providers, onChange, onSave, onCancel }: ApiKeyFormProps) {
  const { ui } = useLocale();
  return (
    <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--matcha-400)] rounded-[var(--radius-xl)]">
      <CardHeader>
        <CardTitle className="font-headline text-[var(--clay-black)]">
          <LocalizedValue value={isAdding ? "Tambah API Key Baru" : "Edit API Key"} />
        </CardTitle>
        <CardDescription className="text-[var(--warm-charcoal)]">
          <LocalizedValue value={isAdding
            ? "Tambahkan konfigurasi provider baru."
            : "Kosongkan field API Key jika tidak ingin mengubahnya."} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[var(--clay-black)]"><LocalizedText source={"Nama Config"} /></Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder={ui("Contoh: OpenAI GPT-4o")}
            className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-[var(--clay-black)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-[var(--clay-black)]"><LocalizedText source={"Provider"} /></Label>
            <Select
              items={providers}
              value={form.provider}
              onValueChange={(v: string | null) => onChange("provider", v ?? "openai")}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder={ui("Pilih provider")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {providers.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{ui(p.label)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model" className="text-[var(--clay-black)]"><LocalizedText source={"Model"} /></Label>
            <Input
              id="model"
              value={form.modelName}
              onChange={(e) => onChange("modelName", e.target.value)}
              placeholder={ui("gpt-4o-mini")}
              className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-[var(--clay-black)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl" className="text-[var(--clay-black)]"><LocalizedText source={"Base URL"} /></Label>
            <Input
              id="baseUrl"
              value={form.baseUrl}
              onChange={(e) => onChange("baseUrl", e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-[var(--clay-black)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTokens" className="text-[var(--clay-black)]"><LocalizedText source={"Max Tokens"} /></Label>
            <Input
              id="maxTokens"
              type="number"
              min={1}
              max={1_000_000}
              value={form.maxTokens}
              onChange={(e) => onChange("maxTokens", Number(e.target.value))}
              placeholder="16384"
              className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-[var(--clay-black)]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-[var(--clay-black)]">
            <LocalizedText source={"API Key"} />
            {!isAdding && (
              <span className="text-[var(--warm-silver)] font-normal ml-1">
                <LocalizedText source={"(kosongkan jika tidak diubah)"} />
              </span>
            )}
          </Label>
          <Input
            id="apiKey"
            type="password"
            value={form.apiKey}
            onChange={(e) => onChange("apiKey", e.target.value)}
            placeholder={isAdding ? "sk-..." : "•••••••• (kosongkan untuk tidak mengubah)"}
            className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-[var(--clay-black)]"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onSave}
            disabled={!canSave || isSaving}
            className="bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] rounded-[var(--radius-lg)] h-11 clay-shadow clay-hover"
          >
            <LocalizedValue value={isSaving ? "Menyimpan..." : isAdding ? "Simpan" : "Update"} />
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-[var(--radius-lg)] h-11 border-2 border-[var(--oat-border)]"
          >
            <LocalizedText source={"Batal"} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
