import { NavLink, Link } from 'react-router-dom';
import { Fingerprint, ArrowUpRight } from 'lucide-react';
export default function Navbar() {
  return <header className="topbar"><Link className="brand" to="/"><Fingerprint size={32}/><span>AI MYSTERY<span className="brand-light"> ROOM</span><small>THE INVESTIGATION BUREAU</small></span></Link><nav aria-label="Main navigation"><NavLink to="/" end>New investigation</NavLink><NavLink to="/history">Case archive</NavLink></nav><span className="bureau-status"><i/> Bureau online <ArrowUpRight size={14}/></span></header>;
}
