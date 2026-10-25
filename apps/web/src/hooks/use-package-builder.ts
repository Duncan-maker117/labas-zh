import { groupBundleQuestions, selectBundleQuestions, type BundleQuestion } from "@/lib/package-selection";
import { sectionLabel } from "@/lib/format";
import { uiMessage, useLocale } from "@/lib/locale";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";

export function usePackageBuilder() {
  const navigate = useNavigate();
  const { ui } = useLocale();

  const createPackage = useMutation(trpc.package.create.mutationOptions());
  const addSection = useMutation(trpc.package.addSection.mutationOptions());
  const addQuestion = useMutation(trpc.package.addQuestion.mutationOptions());

  const isPending = createPackage.isPending || addSection.isPending || addQuestion.isPending;

  const handleCreatePackage = async (params: {
    selectedIds: Set<string>;
    questions: Array<{ id: string; examTypeId: string; sectionTypeId: string; sectionTypeName?: string | null; [key: string]: unknown }>;
    title: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (params.selectedIds.size === 0) return;

    const firstId = Array.from(params.selectedIds)[0];
    const firstQ = params.questions.find((q) => q.id === firstId);
    const examTypeId = firstQ?.examTypeId ?? "";

    try {
      const pkg = await createPackage.mutateAsync({
        title: params.title,
        description: params.description,
        examTypeId,
        isPublic: params.isPublic,
        estimatedDurationMin: params.selectedIds.size * 2,
      });

      const selected = params.questions.filter((q) => params.selectedIds.has(q.id) && q.examTypeId === examTypeId);
      for (const [index, group] of groupBundleQuestions(selected).entries()) {
        const sec = await addSection.mutateAsync({ packageId: pkg.id, sectionTypeId: group.sectionTypeId, title: sectionLabel(group.sectionTypeId, ui, { examType: examTypeId }), orderIndex: index });
        for (const [orderIndex, q] of group.questions.entries()) await addQuestion.mutateAsync({ sectionId: sec.id, questionId: q.id, orderIndex });
      }

      navigate({ to: "/package/$id", params: { id: pkg.id } });
    } catch (err: unknown) {
      toast.error(uiMessage("Gagal membuat paket"), { description: getErrorMessage(err) });
    }
  };

  const handleAutoBundle = async (params: {
    title: string;
    description: string;
    isPublic: boolean;
    examTypeId: string;
    sectionTypeId?: string;
    count: number;
    sortOrder: "random" | "difficulty";
    allQuestions: BundleQuestion[];
  }) => {
    const picked = selectBundleQuestions(params.allQuestions, params.examTypeId, params.sectionTypeId, params.count, params.sortOrder);

    if (picked.length === 0) {
      toast.error(uiMessage("Tidak ada soal tersedia untuk ujian ini."));
      return false;
    }

    try {
      const pkg = await createPackage.mutateAsync({
        title: params.title,
        description: params.description,
        examTypeId: params.examTypeId,
        isPublic: params.isPublic,
        estimatedDurationMin: picked.length * 2,
      });

      for (const [index, group] of groupBundleQuestions(picked).entries()) {
        const sec = await addSection.mutateAsync({ packageId: pkg.id, sectionTypeId: group.sectionTypeId, title: sectionLabel(group.sectionTypeId, ui, { examType: params.examTypeId }), orderIndex: index });
        for (const [orderIndex, q] of group.questions.entries()) await addQuestion.mutateAsync({ sectionId: sec.id, questionId: q.id, orderIndex });
      }

      navigate({ to: "/package/$id", params: { id: pkg.id } });
      return true;
    } catch (err: unknown) {
      toast.error(uiMessage("Gagal membuat paket"), { description: getErrorMessage(err) });
      return false;
    }
  };

  return {
    isPending,
    handleCreatePackage,
    handleAutoBundle,
  };
}
