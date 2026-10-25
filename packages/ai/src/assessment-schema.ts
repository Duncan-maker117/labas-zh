import { z } from "zod";

export const responseAssessmentSchema = z.object({
  criteria: z.object({ task: z.number().int().min(0).max(100), organization: z.number().int().min(0).max(100), vocabulary: z.number().int().min(0).max(100), grammar: z.number().int().min(0).max(100) }),
  feedback: z.string().min(1).max(6000),
  improvements: z.array(z.string().max(2000)).max(8),
});
export type ResponseAssessment = z.infer<typeof responseAssessmentSchema> & { score: number; basis: "text" };

export function parseResponseAssessment(value: unknown): ResponseAssessment {
  const result = responseAssessmentSchema.parse(value);
  const score = Math.round(Object.values(result.criteria).reduce((sum, item) => sum + item, 0) / 4);
  return { ...result, score, basis: "text" };
}
