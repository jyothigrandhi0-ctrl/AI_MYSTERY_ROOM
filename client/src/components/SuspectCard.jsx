import { Check, UserRound } from 'lucide-react';
export default function SuspectCard({ suspect, selected, onSelect, disabled }) {
  return <button type="button" className={`suspect-card ${selected ? 'selected' : ''}`} aria-pressed={selected} disabled={disabled} onClick={onSelect}><div className="suspect-top"><div className="avatar"><UserRound size={28}/></div><span className="suspect-id">{suspect.id}</span><span className="radio">{selected && <Check size={13}/>}</span></div><h3>{suspect.name}</h3><p>{suspect.description}</p><dl><dt>MOTIVE</dt><dd>{suspect.motive}</dd><dt>ALIBI</dt><dd>{suspect.alibi}</dd><dt>CONNECTIONS</dt><dd>{suspect.relationships}</dd></dl></button>;
}
