import { z } from 'zod';

export const editorialSafetySchema = z.object({
  decision: z.enum(['allow', 'review', 'block']),
  reason: z.string().trim().min(2).max(500),
  riskFlags: z.array(z.string().trim().min(2).max(160)).max(8),
});
export type EditorialSafety = z.infer<typeof editorialSafetySchema>;

/** 宽松的娱乐讽刺尺度；风险提示是写作约束，不等于禁止创作。 */
export const EDITORIAL_SAFETY_POLICY = `Permissive meme-editorial policy:
- Default to ALLOW ordinary celebrity gossip, public roasts, internet absurdity, sharp criticism, profanity, playful insults, embarrassment, public-persona parody, consensual public banter, and deliberately ridiculous exaggeration. Controversy, a negative tone, or a named public figure is NOT a blocking reason.
- ALLOW clearly fictional character dialogue, fake commercials, fake newsreader framing, comic metaphors and impossible scenarios. Never present invented dialogue as an authentic quotation or invented serious misconduct as fact.
- ALLOW a sourced public joke such as a celebrity calling a host 'creepy'. Preserve who said it and the playful context; do not infer actual stalking. A charged word, a famous person's name, or a generic 'defamation-adjacent' warning alone never requires REVIEW.
- ALLOW material with manageable wording concerns. Put concrete attribution, privacy and factual constraints in riskFlags and proceed. Do not sanitize all bite, force praise, add moral lectures, or require disclaimers on every lyric line.
- BLOCK when the core focus falls within the owner's excluded topics: race/ethnicity, religion, antisemitism/Israel, gender/sexual minorities, government/military affairs, elections, abortion, firearms, war, terrorism, mass violence or an unfolding tragedy. Incidental mentions, webpage menus and unrelated source boilerplate do not define the story's core focus.
- BLOCK targeted abuse of victims or minors, identity-based hate, exposure of private details, or a premise dependent on fabricated serious accusations. Critique public actions, choices and performative behavior, not protected traits or disability. For ordinary people's viral behavior, prefer anonymized situation-level humor instead of targeted harassment.
- REVIEW only when the central fact or quotation cannot be verified from the supplied source and removing it would destroy the premise. Identify the specific missing evidence. Do not choose REVIEW merely because careful wording is needed.
- Distinguish joking 'creepy' from an allegation of stalking, a silly costume from body-shaming, a fictional salesperson from a real fraud accusation, and satire from a factual report. Judge the source in context, not by isolated keywords.`;

/** 仅复核旧式或模糊 REVIEW，正常放行不增加模型调用，硬禁区不绕过。 */
export async function resolveEditorialSafety(
  initial: EditorialSafety,
  reassess: (initial: EditorialSafety) => Promise<EditorialSafety>
) {
  if (initial.decision !== 'review') return initial;
  const resolved = editorialSafetySchema.parse(await reassess(initial));
  return { ...resolved, riskFlags: [...new Set([...initial.riskFlags, ...resolved.riskFlags])].slice(0, 8) };
}

export function editorialSafetyError(safety: Pick<EditorialSafety, 'decision' | 'reason'>) {
  const prefix =
    safety.decision === 'block'
      ? "This story is outside ScoopRYM's editorial safety boundary"
      : 'The source needs clearer evidence or attribution before writing';
  return Object.assign(new Error(`${prefix}: ${safety.reason}`), { statusCode: 422 });
}
