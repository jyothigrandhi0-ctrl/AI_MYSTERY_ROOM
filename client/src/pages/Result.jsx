import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Fingerprint, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { Timeline } from './Investigation.jsx';
export default function Result() {
  const { id } = useParams(); const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { let active = true; setData(null); api(`/cases/${id}/result`).then(d => { if (active) setData(d); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [id]);
  if (!data) return <main className="page"><p role="status">{error || 'Unsealing the solution…'}</p><Link to={`/cases/${id}`}>Return to investigation</Link></main>;
  const culprit = data.suspects.find(s => s.id === data.solution.culpritId);
  return <main className="page result-page"><div className="result-seal">{data.attempt.isCorrect ? <CheckCircle2 size={48}/> : <Fingerprint size={48}/>}</div><span className="section-label">CASE CLOSED / {id.slice(-6).toUpperCase()}</span><h1>{data.attempt.isCorrect ? 'A sharp eye. A solved case.' : 'The evidence tells another story.'}</h1><p className="muted">{data.title}</p><section className="panel culprit"><span className="section-label">THE CULPRIT</span><h2>{culprit.name}</h2><p>You accused <strong>{data.suspects.find(s => s.id === data.attempt.selectedSuspectId)?.name}</strong>. {data.attempt.isCorrect ? 'Your deduction was correct.' : 'Review the reconstruction to see how the clues connect.'}</p></section><section className="panel"><h2>How it happened</h2><p className="explanation">{data.solution.explanation}</p><div className="clue-tags">{data.solution.supportingEvidenceIds.map(e => <span className="pill" key={e}>SUPPORTING CLUE / {e}</span>)}</div></section><section className="panel"><h2>The full reconstruction</h2><Timeline items={data.timeline}/></section><div className="result-actions"><Link className="button primary" to="/">Start a new investigation <ArrowRight size={17}/></Link><Link className="button secondary" to={`/cases/${id}`}>Review evidence</Link><Link to="/history">Case archive →</Link></div></main>;
}
