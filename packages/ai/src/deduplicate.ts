/** Jaccard similarity on word tokens: intersection / union */
export function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(
    a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2),
  );
  const wordsB = new Set(
    b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2),
  );
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

const SIMILARITY_THRESHOLD = 0.65;

export interface DuplicatePair {
  keepIndex: number;
  removeIndex: number;
  keepText: string;
  removeText: string;
  similarity: number;
}

export function findSimilarPairs(questions: Array<{ questionText: string }>): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const sim = textSimilarity(questions[i]!.questionText, questions[j]!.questionText);
      if (sim >= SIMILARITY_THRESHOLD) {
        pairs.push({
          keepIndex: i,
          removeIndex: j,
          keepText: questions[i]!.questionText,
          removeText: questions[j]!.questionText,
          similarity: sim,
        });
      }
    }
  }
  return pairs;
}
