import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Investigation from './pages/Investigation.jsx';
import Result from './pages/Result.jsx';
import History from './pages/History.jsx';
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <><a className="skip" href="#content">Skip to content</a><Navbar/><div id="content"><Routes><Route path="/" element={<Home/>}/><Route path="/cases/:id" element={<Investigation/>}/><Route path="/cases/:id/result" element={<Result/>}/><Route path="/history" element={<History/>}/><Route path="*" element={<main className="page"><h1>File not found.</h1><Link to="/">Return to bureau</Link></main>}/></Routes></div><footer><span>AI MYSTERY ROOM <small>© {new Date().getFullYear()}</small></span><p>Entirely fictional. Endlessly curious.</p><span className="footer-note">BUILT FOR THE INQUISITIVE MIND ↗</span></footer></>;
}
