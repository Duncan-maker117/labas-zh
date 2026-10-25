import { groupBundleQuestions } from "@/lib/package-selection";
import { getExamProfile, getExamSections, getExamFormats } from "@labas/ai/exam-catalog";
import { ExamScope } from "@/components/exam/ExamScope";
import { supportsSectionFormat } from "@labas/ai/practice-policy";
import { useLocale, uiMessage } from "@/lib/locale";
import { LocalizedText } from "@/components/ui/LocalizedText";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { trpc, queryClient } from "@/utils/trpc";
import { EXAM_TYPES, SECTIONS } from "@/lib/exam-constants";
import { difficultyLabel, formatLabel, sectionLabel } from "@/lib/format";
import { usePackageBuilder } from "@/hooks/use-package-builder";
import { useLocalStorageBoolean } from "@/hooks/use-local-storage-boolean";
import { AutoBundleModal } from "@/components/bank/AutoBundleModal";
import { QuestionDetailModal } from "@/components/bank/QuestionDetailModal";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PageTour, TourHelpButton } from "@/components/TourGuide";
import { FilterBar } from "@/components/bank/FilterBar";
import { MobileFilterSheet } from "@/components/bank/MobileFilterSheet";
import { AdvancedFilters } from "@/components/bank/AdvancedFilters";
import { SoalBrowser } from "@/components/bank/SoalBrowser";
import { SectionBrowser } from "@/components/bank/SectionBrowser";
import { BundleSidebar } from "@/components/bank/BundleSidebar";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";
import type { Question, PackageSection } from "@/lib/types";
import type { Step } from "react-joyride";
import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";

const FILTER_ADVANCED_KEY = "labas-bank-filter-advanced";

export const Route = createFileRoute("/bank")({
  validateSearch: z.object({
    mode: z.enum(["soal", "section"]).optional(),
    tab: z.enum(["mine", "public"]).optional(),
    search: z.string().optional(),
    examType: z.string().optional(),
    examProfile: z.string().optional(),
    section: z.string().optional(),
    format: z.string().optional(),
    difficulty: z.coerce.number().optional(),
    visibility: z.enum(["all", "private", "public"]).optional(),
  }).parse,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type QuestionTab = "mine" | "public";
type Mode = "soal" | "section";

export function BankComponent() {
  const { ui } = useLocale();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const mode: Mode = search.mode ?? "soal";
  const tab: QuestionTab = search.tab ?? "public";
  const searchText = search.search ?? "";
  const examType = search.examType ?? "";
  const examProfile = getExamProfile(examType, search.examProfile)?.id;
  const section = search.section ?? "";
  const examContext = { examType, examProfile, section };
  const format = search.format ?? "";
  const difficulty = search.difficulty;
  const visibilityFilter = search.visibility ?? "all";

  // ── Infinite scroll state ──
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 12;
  const filterKey = JSON.stringify({ searchText, examType, section, format, difficulty, tab, mode, visibility: visibilityFilter });

  // ── Sidebar / Bundle State ──
  const [bundleQuestions, setBundleQuestions] = useState<Question[]>([]);
  const [bundleSections, setBundleSections] = useState<PackageSection[]>([]);
  const [bundleTitle, setBundleTitle] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundleIsPublic, setBundleIsPublic] = useState(false);

  // ── Modals ──
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isAutoBundleOpen, setIsAutoBundleOpen] = useState(false);
  const [collectingBundle, setCollectingBundle] = useState(false);

  // ── Filter UI State ──
  const [isAdvancedOpen, setIsAdvancedOpen] = useLocalStorageBoolean(FILTER_ADVANCED_KEY, false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // ── Data Queries ──
  const visibilityFilterParam = tab === "mine" && visibilityFilter !== "all"
    ? { isPublic: visibilityFilter === "public" }
    : {};

  const privateCountQuery = useQuery(
    trpc.question.list.queryOptions(
      { creatorUserId: userId ?? "", isPublic: false, limit: 1 },
      { enabled: !!userId && mode === "soal" },
    ),
  );
  const totalPrivateCount = privateCountQuery.data?.total ?? 0;

  const questionFilters = {
    search: searchText || undefined, examTypeId: examType || undefined,
    sectionTypeId: section || undefined, format: format || undefined, difficulty,
    ...(tab === "mine" && userId ? { creatorUserId: userId, ...visibilityFilterParam } : { isPublic: true }),
  };
  const questionQuery = useQuery(trpc.question.list.queryOptions({ ...questionFilters, limit, offset }, { enabled: mode === "soal" && (tab === "public" || !!userId), meta: { handlesError: true } }));

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
    setAllQuestions([]);
  }, [filterKey]);

  // Append / replace questions when query data arrives
  useEffect(() => {
    const data = questionQuery.data;
    if (!data) return;
    if (offset === 0) {
      setAllQuestions(data.questions ?? []);
    } else {
      setAllQuestions((prev) => {
        const existingIds = new Set(prev.map((q) => q.id));
        const newQs = (data.questions ?? []).filter((q: Question) => !existingIds.has(q.id));
        return [...prev, ...newQs];
      });
    }
  }, [questionQuery.data]);

  const totalQuestions = questionQuery.data?.total ?? 0;
  const hasMore = offset + limit < totalQuestions;

  const sectionQuery = useQuery(
    trpc.combo.availableSections.queryOptions(
      {
        examTypeId: examType || undefined,
        search: searchText || undefined,
        limit: 50,
        offset: 0,
      },
      { enabled: mode === "section" },
    ),
  );

  // ── Mutations ──
  const { isPending: isPackagePending, handleAutoBundle } = usePackageBuilder();

  const createPackage = useMutation(trpc.package.create.mutationOptions());
  const addSection = useMutation(trpc.package.addSection.mutationOptions());
  const addQuestion = useMutation(trpc.package.addQuestion.mutationOptions());
  const createCombo = useMutation(trpc.combo.create.mutationOptions());

  const togglePublic = useMutation({
    ...trpc.question.togglePublic.mutationOptions(),
    onSuccess: () => questionQuery.refetch(),
  });

  const deleteQuestion = useMutation({
    ...trpc.question.delete.mutationOptions(),
    onSuccess: () => questionQuery.refetch(),
  });

  const bulkPublish = useMutation(
    trpc.question.bulkPublish.mutationOptions({
      onSuccess: (data) => {
        // Reset accumulated infinite-scroll state so refetch shows fresh data
        setAllQuestions([]);
        if (offset !== 0) {
          setOffset(0);
        } else {
          questionQuery.refetch();
        }
        privateCountQuery.refetch();
        if (data.skipped > 0) {
          toast.success(
            uiMessage(`${data.updated} soal dipublikasikan, ${data.skipped} dilewati`),
            { description: uiMessage("Beberapa soal bukan milikmu atau sudah tidak tersedia.") },
          );
        } else {
          toast.success(uiMessage(`${data.updated} soal berhasil dipublikasikan`));
        }
      },
      onError: (err) => {
        toast.error(uiMessage("Gagal mempublikasikan. Coba refresh dan pilih ulang soal."), { description: getErrorMessage(err) });
      },
    }),
  );

  const bulkPublishAllPrivate = useMutation(
    trpc.question.bulkPublishAllPrivate.mutationOptions({
      onSuccess: (data) => {
        setAllQuestions([]);
        if (offset !== 0) {
          setOffset(0);
        } else {
          questionQuery.refetch();
        }
        privateCountQuery.refetch();
        toast.success(uiMessage(`${data.updated} soal berhasil dipublikasikan`));
      },
      onError: (err) => {
        toast.error(uiMessage("Gagal mempublikasikan semua soal."), { description: getErrorMessage(err) });
      },
    }),
  );

  const handlePublishAllPrivate = () => {
    bulkPublishAllPrivate.mutate();
  };

  // ── Navigation helpers ──
  const setMode = (newMode: Mode) => {
    navigate({
      search: {
        mode: newMode,
        tab: newMode === "soal" ? "mine" : undefined,
        search: "",
        examType: "",
        examProfile: undefined,
        section: "",
        format: "",
        difficulty: undefined,
      },
    });
    if (newMode === "soal") setBundleSections([]);
    else setBundleQuestions([]);
  };

  const setSearch = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, search: value }) });

  const setExamType = (value: string) =>
    navigate({ search: (prev) => {
      const profile = getExamProfile(value)?.id;
      const nextSection = !value || getExamSections(value, profile).some((item) => item.id === prev.section) ? prev.section : undefined;
      const nextFormat = !value || getExamFormats(value, nextSection, profile).includes(prev.format ?? "") ? prev.format : undefined;
      return { ...prev, examType: value || undefined, examProfile: undefined, section: nextSection, format: nextFormat };
    } });

  const setExamProfile = (profile: string) => navigate({ search: (prev) => {
    const nextSection = getExamSections(examType, profile).some((item) => item.id === prev.section) ? prev.section : undefined;
    return { ...prev, examProfile: profile, section: nextSection, format: getExamFormats(examType, nextSection, profile).includes(prev.format ?? "") ? prev.format : undefined };
  } });

  const setSection = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, section: value, format: value && prev.format && !supportsSectionFormat(value, prev.format, examType || undefined, examProfile) ? undefined : prev.format }) });

  const setFormat = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, format: value }) });

  const setDifficulty = (value: number | undefined) =>
    navigate({ search: (prev) => ({ ...prev, difficulty: value }) });

  const setVisibility = (value: "all" | "private" | "public") =>
    navigate({ search: (prev) => ({ ...prev, visibility: value === "all" ? undefined : value }) });

  const setTab = (newTab: QuestionTab) =>
    navigate({
      search: {
        mode: "soal",
        tab: newTab,
        search: "",
        examType: "",
        examProfile: undefined,
        section: "",
        format: "",
        difficulty: undefined,
        visibility: undefined,
      },
    });

  const clearFilters = () =>
    navigate({
      search: (prev) => ({
        ...prev,
        search: "",
        examType: "",
        examProfile: undefined,
        section: "",
        format: "",
        difficulty: undefined,
        visibility: undefined,
      }),
    });

  const hasFilters =
    !!searchText || !!examType || !!section || !!format || difficulty !== undefined;

  // ── Active filter chips data ──
  const activeChips = [
    ...(examType ? [{ key: "examType", label: EXAM_TYPES.find((t) => t.id === examType)?.name ?? examType, onRemove: () => setExamType("") }] : []),
    ...(section ? [{ key: "section", label: sectionLabel(section, ui, examContext), onRemove: () => setSection("") }] : []),
    ...(format ? [{ key: "format", label: formatLabel(format, ui, examContext), onRemove: () => setFormat("") }] : []),
    ...(difficulty !== undefined ? [{ key: "difficulty", label: difficultyLabel(difficulty, ui), onRemove: () => setDifficulty(undefined) }] : []),
  ];

  // ── Bundle helpers ──
  const lockedExamType = bundleQuestions.length > 0 ? bundleQuestions[0]?.examTypeId : null;

  const isQuestionInBundle = (qid: string) =>
    bundleQuestions.some((q) => q.id === qid);

  const isSectionInBundle = (sid: string) =>
    bundleSections.some((s) => s.id === sid);

  const toggleQuestion = (q: Question) => {
    if (lockedExamType && q.examTypeId !== lockedExamType) {
      toast.error(uiMessage(`Hanya bisa memilih soal dari ${EXAM_TYPES.find((t) => t.id === lockedExamType)?.name ?? lockedExamType}`));
      return;
    }
    setBundleQuestions((prev) => {
      const exists = prev.find((x) => x.id === q.id);
      if (exists) return prev.filter((x) => x.id !== q.id);
      return [...prev, q];
    });
  };

  const toggleSection = (s: PackageSection) => {
    setBundleSections((prev) => {
      const exists = prev.find((x) => x.id === s.id);
      if (exists) return prev.filter((x) => x.id !== s.id);
      return [...prev, s];
    });
  };

  const removeFromBundle = (id: string, type: "question" | "section") => {
    if (type === "question") {
      setBundleQuestions((prev) => prev.filter((x) => x.id !== id));
    } else {
      setBundleSections((prev) => prev.filter((x) => x.id !== id));
    }
  };

  // ── Create handlers ──
  const handleCreateFromQuestions = async () => {
    if (!bundleTitle || bundleQuestions.length === 0) return;
    const first = bundleQuestions[0];
    try {
      const pkg = await createPackage.mutateAsync({
        title: bundleTitle,
        description: bundleDescription,
        examTypeId: first?.examTypeId ?? "",
        isPublic: bundleIsPublic,
        estimatedDurationMin: bundleQuestions.length * 2,
      });
      const selected = bundleQuestions.map((q) => ({ id: q.id, examTypeId: q.examTypeId ?? first?.examTypeId ?? "", sectionTypeId: q.sectionTypeId ?? "READING" }));
      for (const [index, group] of groupBundleQuestions(selected).entries()) {
        const sec = await addSection.mutateAsync({ packageId: pkg.id, sectionTypeId: group.sectionTypeId, title: sectionLabel(group.sectionTypeId, ui, examContext), orderIndex: index });
        for (const [orderIndex, q] of group.questions.entries()) await addQuestion.mutateAsync({ sectionId: sec.id, questionId: q.id, orderIndex });
      }
      setBundleQuestions([]);
      setBundleTitle("");
      setBundleDescription("");
    } catch (err: unknown) {
      toast.error(uiMessage("Gagal membuat paket"), { description: getErrorMessage(err) });
    }
  };

  const handleCreateFromSections = async () => {
    if (!bundleTitle || bundleSections.length === 0) return;
    try {
      await createCombo.mutateAsync({
        title: bundleTitle,
        description: bundleDescription,
        isPublic: bundleIsPublic,
        sections: bundleSections.map((s, i) => ({
          sourcePackageId: s.packageId ?? "",
          sourceSectionId: s.id,
          orderIndex: i,
        })),
      });
      setBundleSections([]);
      setBundleTitle("");
      setBundleDescription("");
      toast.success(uiMessage("Combo paket berhasil dibuat!"));
    } catch (err: unknown) {
      toast.error(uiMessage("Gagal membuat combo"), { description: getErrorMessage(err) });
    }
  };

  // ── Auto Bundle ──
  const autoBundleExamType = examType || lockedExamType || null;
  const autoBundleSectionType = section || null;

  const autoBundleFilters = { ...questionFilters, examTypeId: autoBundleExamType ?? undefined };
  const bundleCountQuery = useQuery(trpc.question.list.queryOptions({ ...autoBundleFilters, limit: 1, offset: 0 }, { enabled: isAutoBundleOpen && !!autoBundleExamType && (tab === "public" || !!userId), staleTime: 0 }));
  const relaxBundleFilters = () => {
    setIsAutoBundleOpen(false);
    void navigate({ search: (previous) => ({ ...previous, section: undefined, format: undefined, difficulty: undefined, search: undefined, visibility: undefined }) });
  };
  const generateForBundle = () => {
    setIsAutoBundleOpen(false);
    void navigate({ to: "/generate", search: { examType: autoBundleExamType ?? undefined, examProfile, section: section || undefined } });
  };

  const onAutoBundle = async (data: {
    title: string;
    description: string;
    isPublic: boolean;
    count: number;
    sortOrder: "random" | "difficulty";
  }) => {
    if (collectingBundle || isPackagePending || data.count < 1) return;
    setCollectingBundle(true);
    try {
      const batchSize = 50;
      const firstPage = await queryClient.fetchQuery(trpc.question.list.queryOptions({ ...autoBundleFilters, limit: batchSize, offset: 0 }));
      const allQuestions = [...firstPage.questions];
      for (let offset = batchSize; offset < firstPage.total; offset += batchSize) {
        const page = await queryClient.fetchQuery(trpc.question.list.queryOptions({ ...autoBundleFilters, limit: batchSize, offset }));
        allQuestions.push(...page.questions);
      }
      const created = await handleAutoBundle({ ...data, examTypeId: autoBundleExamType ?? "", sectionTypeId: section || undefined, allQuestions });
      if (created) setIsAutoBundleOpen(false);
    } catch (error) { toast.error(uiMessage("Gagal membuat paket"), { description: getErrorMessage(error) }); }
    finally { setCollectingBundle(false); }
  };

  // ── Render helpers ──
  const questions = allQuestions;

  const sections = sectionQuery.data?.sections ?? [];
  const groupedSections = sections.reduce<Record<string, PackageSection[]>>((groups, s) => {
    const key = `${s.examTypeName ?? "Unknown"} — ${s.packageTitle ?? "Untitled"}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s as PackageSection);
    return groups;
  }, {});

  const isCreating =
    createPackage.isPending ||
    addSection.isPending ||
    addQuestion.isPending ||
    createCombo.isPending;

  return (
    <div className="min-h-screen pb-32 bg-[var(--warm-cream)]">
      <FilterBar
        mode={mode}
        tab={tab}
        searchText={searchText}
        examType={examType}
        visibility={visibilityFilter}
        activeChips={activeChips}
        hasFilters={hasFilters}
        isAdvancedOpen={isAdvancedOpen}
        lockedExamType={lockedExamType}
        dataTour="bank-filters"
        onToggleAdvanced={() => setIsAdvancedOpen((v) => !v)}
        onSetMode={setMode}
        onSetTab={setTab}
        onSetSearch={setSearch}
        onSetExamType={setExamType}
        onSetVisibility={setVisibility}
        onClearFilters={clearFilters}
        onOpenMobileSheet={() => setIsMobileSheetOpen(true)}
        advancedFilters={
          <AdvancedFilters
            examType={examType}
            examProfile={examProfile}
            section={section}
            format={format}
            difficulty={difficulty}
            onSetSection={setSection}
            onSetFormat={setFormat}
            onSetDifficulty={setDifficulty}
          />
        }
      />
      {examType && <div className="mx-auto max-w-7xl px-6 pt-4 md:px-12 lg:px-16"><ExamScope examType={examType} profile={examProfile} onProfileChange={setExamProfile} sections={section ? [section] : undefined} /></div>}

      <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto pt-6">
        <section className="mb-8">
          <h1 className="text-4xl font-headline font-extrabold text-[var(--clay-black)] tracking-tight">
            <LocalizedText source={"Buat Paket"} />
          </h1>
          <p className="text-lg text-[var(--warm-charcoal)] mt-2">
            <LocalizedText source={"Pilih soal atau section untuk dibuatkan paket latihan."} />
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--warm-charcoal)]">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--matcha-300)]/30 text-[var(--matcha-800)] font-medium">
              <MaterialIcon name="auto_awesome" className="text-sm" />
              <LocalizedText source={"Auto Bundle — biarkan AI pilihkan soal otomatis"} />
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--slushie-500)]/20 text-[var(--slushie-800)] font-medium">
              <MaterialIcon name="touch_app" className="text-sm" />
              <LocalizedText source={"Manual — pilih sendiri soal satu per satu"} />
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div data-tour="bank-questions" className="lg:col-span-8">
            {mode === "soal" ? (
              <SoalBrowser
                isLoading={questionQuery.isLoading}
                isError={questionQuery.isError}
                onRetry={() => { void questionQuery.refetch(); }}
                questions={questions}
                hasMore={hasMore}
                isFetchingNextPage={questionQuery.isFetching}
                onLoadMore={() => setOffset((prev) => prev + limit)}
                hasFilters={hasFilters}
                userId={userId}
                lockedExamType={lockedExamType}
                tab={tab}
                filterKey={filterKey}
                isQuestionInBundle={isQuestionInBundle}
                onToggleQuestion={toggleQuestion}
                onOpenDetail={setSelectedQuestion}
                onTogglePublic={(id) => togglePublic.mutate({ id })}
                onDelete={(id) => {
                  if (confirm("Yakin mau hapus soal ini?")) deleteQuestion.mutate({ id });
                }}
                onClearFilters={clearFilters}
                onBulkPublish={(ids) => bulkPublish.mutate({ ids })}
                onPublishAllPrivate={handlePublishAllPrivate}
                totalPrivateCount={totalPrivateCount}
              />
            ) : (
              <SectionBrowser
                isLoading={sectionQuery.isLoading}
                groupedSections={groupedSections}
                isSectionInBundle={isSectionInBundle}
                onToggleSection={toggleSection}
              />
            )}
          </div>

          <BundleSidebar
            mode={mode}
            bundleQuestions={bundleQuestions}
            bundleSections={bundleSections}
            bundleTitle={bundleTitle}
            bundleDescription={bundleDescription}
            bundleIsPublic={bundleIsPublic}
            isCreating={isCreating}
            autoBundleExamType={autoBundleExamType}
            lockedExamType={lockedExamType}
            onSetTitle={setBundleTitle}
            onSetDescription={setBundleDescription}
            onSetIsPublic={setBundleIsPublic}
            onRemoveFromBundle={removeFromBundle}
            onCreateFromQuestions={handleCreateFromQuestions}
            onCreateFromSections={handleCreateFromSections}
            onOpenAutoBundle={() => setIsAutoBundleOpen(true)}
          />
        </div>
      </div>

      <MobileFilterSheet
        examType={examType}
        examProfile={examProfile}
        open={isMobileSheetOpen}
        onOpenChange={setIsMobileSheetOpen}
        section={section}
        format={format}
        difficulty={difficulty}
        activeChips={activeChips}
        onSetSection={setSection}
        onSetFormat={setFormat}
        onSetDifficulty={setDifficulty}
        onClearFilters={clearFilters}
      />

      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          isSelected={isQuestionInBundle(selectedQuestion.id)}
          onToggleSelect={() => toggleQuestion(selectedQuestion)}
          isSelectable={true}
        />
      )}

      {isAutoBundleOpen && autoBundleExamType && (
        <AutoBundleModal
          availableCount={bundleCountQuery.data?.total ?? 0}
          examTypeName={EXAM_TYPES.find((t) => t.id === autoBundleExamType)?.name ?? autoBundleExamType}
          sectionTypeName={autoBundleSectionType ? sectionLabel(autoBundleSectionType, ui, examContext) : ui("Semua Section")}
          scopeDescription={[ui(tab === "public" ? "公开题目" : "我的题目"), ...activeChips.filter((chip) => chip.key !== "examType" && chip.key !== "section").map((chip) => chip.label)].join(" · ")}
          isLoading={bundleCountQuery.isPending || bundleCountQuery.isFetching}
          isError={bundleCountQuery.isError}
          onGenerate={generateForBundle}
          onRelaxFilters={relaxBundleFilters}
          onShowMine={tab === "public" ? () => { setIsAutoBundleOpen(false); void navigate({ search: (previous) => ({ ...previous, tab: "mine" }) }); } : undefined}
          onClose={() => setIsAutoBundleOpen(false)}
          onCreate={onAutoBundle}
          isPending={isPackagePending || collectingBundle}
        />
      )}

      <PageTour
        storageKey={BANK_TOUR_KEY}
        autoDelay={600}
        steps={bankPageSteps}
      />
      <TourHelpButton storageKey={BANK_TOUR_KEY} />
    </div>
  );
}

// ── Bank page tour ──
const BANK_TOUR_KEY = "labas-page-tour-bank";
const bankPageSteps: Step[] = [
  {
    target: "[data-tour='bank-filters']",
    title: "Filter & Mode",
    content: "Pilih mode 'Dari Soal' untuk pilih soal satu per satu, atau 'Dari Section' untuk gabung section dari paket yang sudah ada. Filter juga berdasarkan exam type dan kata kunci.",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='bank-questions']",
    title: "Daftar Soal",
    content: "Semua soal yang sesuai filter ditampilkan di sini. Klik soal untuk melihat detail, atau centang untuk menambahkannya ke paket.",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='bank-sidebar']",
    title: "Sidebar Paket",
    content: "Soal yang dipilih muncul di sini. Atur judul, deskripsi, dan visibilitas paket. Klik 'Auto Bundle' untuk isi otomatis, atau 'Buat Paket' untuk simpan.",
    spotlightPadding: 8,
  },
];
