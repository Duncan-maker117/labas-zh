export interface BundleQuestion {
  id: string;
  examTypeId: string;
  sectionTypeId: string;
  sectionTypeName?: string | null;
  difficulty?: number;
}

export function selectBundleQuestions<T extends BundleQuestion>(questions: T[], exam: string, section: string | undefined, count: number, order: "random" | "difficulty", random = Math.random): T[] {
  const available = questions.filter((q) => q.examTypeId === exam && (!section || q.sectionTypeId === section));
  if (order === "difficulty") available.sort((a, b) => (a.difficulty ?? 3) - (b.difficulty ?? 3));
  else for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [available[i], available[j]] = [available[j]!, available[i]!];
  }
  return available.slice(0, Math.max(0, Math.floor(count)));
}

export function groupBundleQuestions<T extends BundleQuestion>(questions: T[]) {
  const groups = new Map<string, T[]>();
  for (const question of questions) groups.set(question.sectionTypeId, [...(groups.get(question.sectionTypeId) ?? []), question]);
  return [...groups].map(([sectionTypeId, items]) => ({ sectionTypeId, questions: items }));
}
