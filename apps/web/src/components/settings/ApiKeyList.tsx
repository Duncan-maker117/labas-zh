import { useLocale } from "@/lib/locale";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { type ApiKeyConfig } from "@/hooks/use-api-key";
import { Button } from "@labas/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@labas/ui/components/card";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface ProviderOption {
  value: string;
  label: string;
}

interface ApiKeyListProps {
  configs: ApiKeyConfig[];
  isLoading: boolean;
  editingId: string | null;
  isFormOpen: boolean;
  providers: ProviderOption[];
  onStartAdd: () => void;
  onStartEdit: (config: ApiKeyConfig) => void;
  onRemove: (id: string) => void;
}

export function ApiKeyList({
  configs,
  isLoading,
  editingId,
  isFormOpen,
  providers,
  onStartAdd,
  onStartEdit,
  onRemove,
}: ApiKeyListProps) {
  const { ui } = useLocale();
  return (
    <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MaterialIcon name="key" className="text-xl" />
            <div>
              <CardTitle className="font-headline text-[var(--clay-black)]"><LocalizedText source={"API Keys"} /></CardTitle>
              <CardDescription className="text-[var(--warm-charcoal)]">
                {configs.length} <LocalizedText source={"konfigurasi tersimpan"} />
              </CardDescription>
            </div>
          </div>
          {!isFormOpen && (
            <Button
              onClick={onStartAdd}
              className="bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] rounded-[var(--radius-lg)] clay-shadow clay-hover text-sm"
            >
              <MaterialIcon name="add" className="mr-1" />
              <LocalizedText source={"Tambah"} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-20 bg-[var(--oat-light)] animate-pulse rounded-[var(--radius-lg)]" />
        ) : configs.length === 0 ? (
          <div className="text-center py-8">
            <MaterialIcon name="key_off" className="text-4xl text-[var(--warm-silver)] mx-auto mb-3" />
            <p className="text-[var(--warm-charcoal)] font-semibold"><LocalizedText source={"Belum ada API key"} /></p>
            <p className="text-xs text-[var(--warm-silver)] mt-1">
              <LocalizedText source={"Tambahkan minimal satu key untuk generate soal."} />
            </p>
            <Button
              onClick={onStartAdd}
              className="mt-4 bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)] rounded-[var(--radius-lg)]"
            >
              <MaterialIcon name="add" className="mr-1" />
              <LocalizedText source={"Tambah API Key"} />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => {
              const isEditing = editingId === config.id;
              return (
                <div
                  key={config.id}
                  className={`p-4 rounded-[var(--radius-lg)] border-2 transition-colors ${
                    isEditing
                      ? "border-[var(--matcha-600)] bg-[var(--matcha-100)]"
                      : "border-[var(--oat-border)] bg-[var(--warm-cream)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[var(--clay-black)] truncate">
                          {config.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[var(--matcha-300)] text-[var(--matcha-800)] text-[10px] font-semibold">
                          {providers.find((p) => p.value === config.provider)?.label ?? config.provider}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--warm-charcoal)]">
                        {config.modelName} · {config.baseUrl.replace("https://", "").replace("/v1", "")}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onStartEdit(config)}
                        className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--oat-light)] text-[var(--warm-charcoal)] transition-colors"
                        title={ui("Edit")}
                      >
                        <MaterialIcon name="edit" className="text-sm" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Yakin mau hapus konfigurasi ini?")) {
                            onRemove(config.id);
                          }
                        }}
                        className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--pomegranate-400)]/10 text-[var(--pomegranate-400)] transition-colors"
                        title={ui("Hapus")}
                      >
                        <MaterialIcon name="delete" className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
