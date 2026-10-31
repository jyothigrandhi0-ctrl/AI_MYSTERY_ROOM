import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api.js';
export default function History() {
  const [cases, setCases] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api('/history').then(setCases).catch(e => setError(e.message)); }, []);
  return <main className="page archive"><span className="section-label">THE INVESTIGATION BUREAU</span><h1>Case archive</h1><p className="muted">Closed files. Uncovered truths. Your investigation record.</p>{error && <p className="error" role="alert">{error}</p>}{!cases && !error && <p role="status">Retrieving archived cases…</p>}{cases?.length === 0 && <div className="empty panel"><Archive size={45}/><h2>Your first case is waiting.</h2><p>Completed investigations will appear here in this browser.</p><Link className="button primary" to="/">Open a new investigation</Link></div>}{cases?.map(c => <Link className="archive-row" key={c._id} to={`/cases/${c.caseId}/result`}><Archive/><div><small>CASE {String(c.caseId).slice(-6).toUpperCase()} · {new Date(c.submittedAt).toLocaleDateString()}</small><h2>{c.title}</h2></div><span className={`pill ${c.isCorrect ? 'cyan' : ''}`}>{c.isCorrect ? 'SOLVED' : 'REVIEWED'}</span><ArrowUpRight size={20}/></Link>)}</main>;
}
