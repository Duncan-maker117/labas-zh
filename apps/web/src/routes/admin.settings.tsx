import { useLocale, uiMessage } from "@/lib/locale";
import { LocalizedText, LocalizedValue } from "@/components/ui/LocalizedText";
import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Input } from "@labas/ui/components/input";
import { Button } from "@labas/ui/components/button";
import { Checkbox } from "@labas/ui/components/checkbox";
import { Label } from "@labas/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@labas/ui/components/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@labas/ui/components/card";
import { DatePicker } from "@labas/ui/components/date-picker";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { ui } = useLocale();
  const queryClient = useQueryClient();

  // ── Platform AI Config ──
  const aiConfig = useQuery(trpc.admin.getPlatformAiConfig.queryOptions());
  const [aiProvider, setAiProvider] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");

  useEffect(() => {
    if (aiConfig.data) {
      setAiProvider(aiConfig.data.provider);
      setAiBaseUrl(aiConfig.data.baseUrl);
      setAiModel(aiConfig.data.model);
    }
  }, [aiConfig.data]);

  const saveAiConfig = useMutation(
    trpc.admin.setPlatformAiConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.admin.getPlatformAiConfig.queryKey(),
        });
        toast.success(uiMessage("AI configuration saved"));
        setAiApiKey("");
      },
      onError: (e: unknown) => toast.error(uiMessage(getErrorMessage(e))),
    }),
  );

  // ── Free Credit Config ──
  const platformConfig = useQuery(trpc.admin.getPlatformConfig.queryOptions());
  const [fcEnabled, setFcEnabled] = useState(false);
  const [fcMaxPool, setFcMaxPool] = useState("");
  const [fcDefaultSignup, setFcDefaultSignup] = useState("");

  useEffect(() => {
    if (platformConfig.data) {
      setFcEnabled(platformConfig.data.freeCreditsEnabled);
      setFcMaxPool(String(platformConfig.data.freeCreditsMaxPool));
    }
  }, [platformConfig.data]);

  const setConfigMutation = useMutation(
    trpc.admin.setPlatformConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.admin.getPlatformConfig.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.admin.dashboardStats.queryKey(),
        });
        toast.success(uiMessage("Config updated"));
      },
      onError: (e: unknown) => toast.error(uiMessage(getErrorMessage(e))),
    }),
  );

  // ── Announcement ──
  const announcement = useQuery(trpc.admin.getAnnouncement.queryOptions());
  const [annMessage, setAnnMessage] = useState("");
  const [annSeverity, setAnnSeverity] = useState<"info" | "warning" | "error">(
    "info",
  );
  const [annExpiryDate, setAnnExpiryDate] = useState<Date | undefined>(undefined);
  const [annExpiryTime, setAnnExpiryTime] = useState("");
  const [annNoExpiry, setAnnNoExpiry] = useState(true);

  useEffect(() => {
    if (announcement.data) {
      setAnnMessage(announcement.data.message);
      setAnnSeverity(announcement.data.severity);
      if (announcement.data.expiresAt) {
        const d = new Date(announcement.data.expiresAt);
        setAnnExpiryDate(d);
        setAnnExpiryTime(d.toTimeString().slice(0, 5));
        setAnnNoExpiry(false);
      } else {
        setAnnExpiryDate(undefined);
        setAnnExpiryTime("");
        setAnnNoExpiry(true);
      }
    }
  }, [announcement.data]);

  const saveAnnouncement = useMutation(
    trpc.admin.setAnnouncement.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.admin.getAnnouncement.queryKey(),
        });
        toast.success(uiMessage("Announcement published"));
      },
      onError: (e: unknown) => toast.error(uiMessage(getErrorMessage(e))),
    }),
  );

  const deleteAnnouncement = useMutation(
    trpc.admin.deleteAnnouncement.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.admin.getAnnouncement.queryKey(),
        });
        toast.success(uiMessage("Announcement removed"));
        setAnnMessage("");
        setAnnSeverity("info");
        setAnnExpiryDate(undefined);
        setAnnExpiryTime("");
        setAnnNoExpiry(true);
      },
      onError: (e: unknown) => toast.error(uiMessage(getErrorMessage(e))),
    }),
  );

  const PROVIDERS = [
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "google", label: "Google" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "groq", label: "Groq" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-headline font-bold text-[var(--clay-black)] mb-1">
        <LocalizedText source={"Settings"} />
      </h1>
      <p className="text-[var(--warm-charcoal)] mb-8">
        <LocalizedText source={"Platform configuration and announcements."} />
      </p>

      <div className="space-y-6 max-w-2xl">
        {/* ── AI Provider Configuration ── */}
        <Card className="bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)] clay-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-headline font-bold text-[var(--clay-black)] flex items-center gap-2">
              <MaterialIcon name="smart_toy" />
              <LocalizedText source={"AI Provider Configuration"} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                <LocalizedText source={"Provider"} />
              </label>
              <Select
                value={aiProvider}
                onValueChange={(v) => v && setAiProvider(v)}
              >
                <SelectTrigger className="w-full h-10 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-sm cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {ui(p.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                <LocalizedText source={"Base URL"} />
              </label>
              <Input
                value={aiBaseUrl}
                onChange={(e) => setAiBaseUrl(e.target.value)}
                className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                <LocalizedText source={"Model"} />
              </label>
              <Input
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                <LocalizedText source={"API Key"} />
                {aiConfig.data?.apiKeyConfigured && (
                  <span className="text-xs text-[var(--matcha-700)] ml-2 font-normal">
                    ({aiConfig.data.apiKeyPreview}<LocalizedText source={") — leave empty to keep current"} />
                  </span>
                )}
              </label>
              <Input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={
                  aiConfig.data?.apiKeyConfigured
                    ? "Type new API key to change"
                    : "Enter platform API key"
                }
                className="rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)]"
              />
            </div>
            <Button
              onClick={() =>
                saveAiConfig.mutate({
                  provider: aiProvider,
                  baseUrl: aiBaseUrl,
                  model: aiModel,
                  apiKey: aiApiKey || undefined,
                })
              }
              disabled={saveAiConfig.isPending || aiConfig.isLoading}
              className="h-10 rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)]"
            >
              <LocalizedValue value={saveAiConfig.isPending ? "Saving..." : "Save AI Config"} />
            </Button>
          </CardContent>
        </Card>

        {/* ── Free Credit Configuration ── */}
        <Card className="bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)] clay-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-headline font-bold text-[var(--clay-black)] flex items-center gap-2">
              <MaterialIcon name="token" />
              <LocalizedText source={"Free Credit Configuration"} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() =>
                  setConfigMutation.mutate({
                    key: "free_credits_enabled",
                    value: String(!fcEnabled),
                  })
                }
                disabled={setConfigMutation.isPending}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
                  fcEnabled
                    ? "bg-[var(--clay-black)] border-[var(--clay-black)]"
                    : "bg-gray-300 border-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-200 ${
                    fcEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[var(--clay-black)]">
                <LocalizedText source={"Enable Free Credits"} />
              </span>
            </label>

            <div>
              <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                <LocalizedText source={"Max Pool Size (tokens)"} />
              </label>
              <Input
                type="number"
                value={fcMaxPool}
                onChange={(e) => setFcMaxPool(e.target.value)}
                className="w-48 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)]"
              />
              <Button
                onClick={() => {
                  const val = parseInt(fcMaxPool, 10);
                  if (isNaN(val) || val <= 0) {
                    toast.error(uiMessage("Enter a valid number"));
                    return;
                  }
                  setConfigMutation.mutate({
                    key: "free_credits_max_pool",
                    value: String(val),
                  });
                }}
                disabled={setConfigMutation.isPending}
                className="mt-2 h-10 mx-2 rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)]"
              >
                <LocalizedText source={"Save Pool Size"} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Announcement ── */}
        <Card className="bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)] clay-shadow overflow-visible">
          <CardHeader>
            <CardTitle className="text-lg font-headline font-bold text-[var(--clay-black)] flex items-center gap-2">
              <MaterialIcon name="campaign" />
              <LocalizedText source={"Announcement"} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                <LocalizedText source={"Message"} />
              </label>
              <textarea
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                placeholder={ui("Enter announcement message...")}
                rows={3}
                className="w-full rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] p-3 text-sm text-[var(--clay-black)] resize-y"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                  <LocalizedText source={"Severity"} />
                </label>
                <Select
                  value={annSeverity}
                  onValueChange={(v) =>
                    v && setAnnSeverity(v as "info" | "warning" | "error")
                  }
                >
                  <SelectTrigger className="w-full h-10 rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)] bg-[var(--pure-white)] text-sm cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <span className="flex items-center gap-2">
                        <MaterialIcon
                          name="info"
                          className="text-sm text-[var(--slushie-500)]"
                        />
                        <LocalizedText source={"Info"} />
                      </span>
                    </SelectItem>
                    <SelectItem value="warning">
                      <span className="flex items-center gap-2">
                        <MaterialIcon
                          name="warning"
                          className="text-sm text-[var(--lemon-500)]"
                        />
                        <LocalizedText source={"Warning"} />
                      </span>
                    </SelectItem>
                    <SelectItem value="error">
                      <span className="flex items-center gap-2">
                        <MaterialIcon
                          name="error"
                          className="text-sm text-[var(--pomegranate-400)]"
                        />
                        <LocalizedText source={"Error"} />
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium text-[var(--clay-black)] block mb-1">
                  <LocalizedText source={"Expiry"} />
                </label>
                <div className="flex gap-2">
                  <DatePicker
                    value={annExpiryDate}
                    onChange={(d) => setAnnExpiryDate(d)}
                    disabled={annNoExpiry}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={annExpiryTime}
                    onChange={(e) => setAnnExpiryTime(e.target.value)}
                    disabled={annNoExpiry}
                    className="w-[130px] rounded-[var(--radius-lg)] border-2 border-[var(--oat-border)]"
                  />
                </div>
                <Label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <Checkbox
                    checked={annNoExpiry}
                    onCheckedChange={(v) => {
                      setAnnNoExpiry(v === true);
                      if (v === true) {
                        setAnnExpiryDate(undefined);
                        setAnnExpiryTime("");
                      }
                    }}
                  />
                  <span className="text-xs text-[var(--warm-charcoal)]"><LocalizedText source={"No expiry"} /></span>
                </Label>
              </div>
            </div>

            {/* Preview */}
            {annMessage && (
              <div className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] border-2 bg-[var(--warm-cream)] border-[var(--oat-border)]">
                <MaterialIcon
                  name={
                    annSeverity === "info"
                      ? "info"
                      : annSeverity === "warning"
                        ? "warning"
                        : "error"
                  }
                  className={`text-base mt-0.5 shrink-0 ${
                    annSeverity === "info"
                      ? "text-[var(--slushie-500)]"
                      : annSeverity === "warning"
                        ? "text-[var(--lemon-500)]"
                        : "text-[var(--pomegranate-400)]"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--warm-charcoal)] mb-0.5">
                    <LocalizedText source={"Preview"} />
                  </p>
                  <p className="text-sm text-[var(--clay-black)]">
                    {annMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  saveAnnouncement.mutate({
                    message: annMessage,
                    severity: annSeverity,
                    expiresAt: annNoExpiry || !annExpiryDate
                      ? null
                      : annExpiryTime
                        ? new Date(
                            annExpiryDate.toISOString().slice(0, 10) + "T" + annExpiryTime,
                          ).toISOString()
                        : annExpiryDate.toISOString(),
                  })
                }
                disabled={saveAnnouncement.isPending || !annMessage.trim()}
                className="flex-1 h-10 rounded-[var(--radius-lg)] bg-[var(--clay-black)] text-[var(--pure-white)] hover:bg-[var(--warm-charcoal)]"
              >
                <LocalizedValue value={saveAnnouncement.isPending
                  ? "Publishing..."
                  : announcement.data
                    ? "Update Announcement"
                    : "Publish Announcement"} />
              </Button>
              {announcement.data && (
                <Button
                  variant="outline"
                  onClick={() => deleteAnnouncement.mutate()}
                  disabled={deleteAnnouncement.isPending}
                  className="h-10 rounded-[var(--radius-lg)] border-2 border-[var(--pomegranate-400)] text-[var(--pomegranate-600)] hover:bg-[var(--pomegranate-100)]"
                >
                  <LocalizedText source={"Remove"} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
