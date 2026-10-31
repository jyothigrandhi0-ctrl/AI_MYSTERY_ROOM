import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
export const examples = [
  { label: 'The missing diamond', text: 'A valuable diamond disappears during a party at a secluded mansion. Five guests were present, and the security camera stopped working for ten minutes.' },
  { label: 'After-hours at the museum', text: 'An ancient manuscript vanishes from a locked museum gallery after closing. Only the curator, a restorer, and a night guard had access to the building.' },
  { label: 'The midnight express', text: 'A confidential envelope goes missing aboard an overnight train. Four passengers entered the dining car before the lights briefly went out.' }
];
export default function ScenarioForm({ onGenerate, busy }) {
  const [scenario, setScenario] = useState('');
  return <form onSubmit={e => { e.preventDefault(); onGenerate(scenario.trim()); }} className="scenario-form"><div className="section-label"><Sparkles size={15}/> YOUR STORY. YOUR INVESTIGATION.</div><h2>Every mystery starts with a detail.</h2><p>Set the scene. We’ll create the suspects, the evidence, and the secrets.</p><label htmlFor="scenario">Describe your mystery</label><textarea id="scenario" value={scenario} onChange={e => setScenario(e.target.value)} minLength={20} maxLength={2000} required placeholder="A priceless diamond disappears at a mansion party. Five guests. A ten-minute camera blackout. Everyone has something to hide…"/><div className="input-meta"><span>Keep it fictional. Leave the solution to us.</span><span>{scenario.length}/2,000</span></div><div className="examples"><span>Need a starting point?</span>{examples.map(ex => <button key={ex.label} type="button" onClick={() => setScenario(ex.text)}>{ex.label} ↗</button>)}</div><button className="button primary generate" disabled={busy || scenario.trim().length < 20} type="submit">Open investigation <ArrowRight size={18}/></button><small className="form-footnote">A unique case. One culprit. The truth is in the details.</small></form>;
}
