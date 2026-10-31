import { z } from 'zod';
const text = z.string().trim().min(1).max(6000);
const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);
export const scenarioSchema = z.object({ scenario: z.string().trim().min(20).max(2000) }).strict();
export const answerSchema = z.object({ selectedSuspectId: id }).strict();
export const generatedCaseSchema = z.object({
  title: text, story: text, setting: text,
  suspects: z.array(z.object({ id, name: text, description: text, motive: text, alibi: text, relationships: text })).min(3).max(5),
  evidence: z.array(z.object({ id, type: z.enum(['chat', 'image', 'cctv']), title: text,
    description: text, timestamp: text,
    messages: z.array(z.object({ sender: text, timestamp: text, text })).max(12),
    imagePrompt: z.string().max(3000)
  })).min(5).max(10),
  timeline: z.array(z.object({ time: text, event: text })).min(3).max(15),
  solution: z.object({ culpritId: id, explanation: text, supportingEvidenceIds: z.array(id).min(2).max(10), timeline: z.array(z.object({ time: text, event: text })).min(3).max(15) })
});
export function validateCase(input) {
  const data = generatedCaseSchema.parse(input);
  const suspects = new Set(data.suspects.map(s => s.id));
  const evidence = new Set(data.evidence.map(e => e.id));
  if (suspects.size !== data.suspects.length || evidence.size !== data.evidence.length) throw new Error('Duplicate case identifiers');
  if (!suspects.has(data.solution.culpritId)) throw new Error('Unknown culprit');
  const supporting = new Set(data.solution.supportingEvidenceIds);
  if (supporting.size < 2 || [...supporting].some(id => !evidence.has(id))) throw new Error('Two distinct supporting clues are required');
  if (!['chat','image','cctv'].every(type => data.evidence.some(e => e.type === type))) throw new Error('Missing evidence type');
  if (data.evidence.some(e => e.type === 'chat' && e.messages.length < 2)) throw new Error('Chat evidence needs messages');
  return data;
}
export function publicCase(data, submitted = false) {
  return { _id: String(data._id), title: data.title, story: data.story, setting: data.setting, status: data.status,
    suspects: data.suspects, evidence: data.evidence, timeline: data.timeline, createdAt: data.createdAt, submitted };
}
