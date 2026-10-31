// MVP descriptive fallback. Never trust or fetch URLs emitted by the model.
export function prepareEvidence(evidence) {
  return evidence.map(item => ({ ...item, mediaUrl: null, fictional: true }));
}
