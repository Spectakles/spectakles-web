import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import SpectaklesLogo from './SpectaklesLogo';
import '../marketing/public-site.css';

// Retained for legacy, unrouted pages; their old waitlist action now leads to an enquiry.
const DemoContext = createContext<(open: boolean) => void>(() => {});
export function useDemo() { return useContext(DemoContext); }
const links = [{ to: '/experience', label: 'The experience' }, { to: '/institutions', label: 'For institutions' }, { to: '/about', label: 'Our approach' }, { to: '/faq', label: 'FAQ' }];

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { setMenuOpen(false); }, [pathname, hash]);
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menuOpen]);
  return <DemoContext.Provider value={open => { if (open) navigate('/contact'); }}><div className="public-site">
    <a className="mkt-skip" href="#main-content">Skip to content</a>
    <header className="mkt-header"><div className="mkt-header-inner mkt-wrap">
      <Link to="/" aria-label="Spectakles home" className="mkt-brand"><SpectaklesLogo height={26} /></Link>
      <nav className="mkt-desktop-nav" aria-label="Main navigation">{links.map(link => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}</nav>
      <div className="mkt-nav-actions"><Link to="/workspace" className="mkt-login">Pilot sign in</Link><Link to="/contact" className="mkt-button mkt-button--small">Discuss a pilot<ArrowUpRight size={15} aria-hidden="true" /></Link><button type="button" className="mkt-menu-toggle" ref={menuButton} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </div>{menuOpen && <nav className="mkt-mobile-nav" id="public-navigation" aria-label="Mobile navigation">{links.map(link => <NavLink key={link.to} to={link.to}>{link.label}<ArrowUpRight size={16} aria-hidden="true" /></NavLink>)}<Link to="/workspace">Pilot sign in</Link><Link to="/contact">Discuss a pilot<ArrowUpRight size={16} aria-hidden="true" /></Link></nav>}</header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="mkt-footer"><div className="mkt-wrap"><div className="mkt-footer-top"><div className="mkt-footer-brand"><Link to="/" aria-label="Spectakles home"><SpectaklesLogo height={28} variant="white" /></Link><p>A room to practise.<br />A voice to bring to the table.</p><a href="mailto:contact@spectakles.in">contact@spectakles.in<ArrowUpRight size={15} aria-hidden="true" /></a></div>
      <nav aria-label="Footer navigation"><div><h2>Explore</h2><Link to="/experience">The experience</Link><Link to="/institutions">For institutions</Link><Link to="/about">Our approach</Link></div><div><h2>Get in touch</h2><Link to="/contact">Discuss a pilot</Link><Link to="/workspace">Pilot sign in</Link><Link to="/faq#privacy">Data & privacy</Link><Link to="/faq">Questions & answers</Link></div></nav></div>
      <div className="mkt-footer-bottom"><span>© {new Date().getFullYear()} Spectakles</span><span>Built around the group discussion.</span><a href="#main-content">Back to top ↑</a></div>
      <div className="mkt-footer-wordmark" aria-hidden="true">spectakles<span>®</span></div>
    </div></footer>
  </div></DemoContext.Provider>;
}
