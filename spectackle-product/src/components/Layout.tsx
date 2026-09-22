import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import WaitlistModal from "./WaitlistModal";
import SpectaklesLogo from "./SpectaklesLogo";
import { trackClick } from "../lib/firebase";

const navLinks = [
  { label: "How it works", to: "/#how-it-works" },
  { label: "For institutions", to: "/#institutions" },
  { label: "Student experience", to: "/#experience" },
  { label: "Impact", to: "/impact" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
  { label: "Blog", to: "/blog" },
];

const DemoContext = createContext<(open: boolean) => void>(() => {});

export function useDemo() {
  return useContext(DemoContext);
}

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("Spectakles-theme") === "dark",
  );
  const location = useLocation();

  const openDemo = (open: boolean) => setShowDemo(open);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("Spectakles-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location]);

  return (
    <DemoContext.Provider value={openDemo}>
      <div className="site-shell">
        <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            className="flex items-center gap-2.5 group"
            to="/"
            aria-label="Spectakles home"
            onClick={() => trackClick("brand_logo", "header")}
          >
            <SpectaklesLogo
              height={36}
              className="h-9 w-auto group-hover:scale-105 transition-transform"
            />
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13.5px] font-semibold text-gray-700" aria-label="Main navigation">
            <Link
              className="inline-block transition-all duration-200 hover:scale-[1.03] hover:text-brand-dark cursor-pointer"
              to="/#how-it-works"
              onClick={() => trackClick("nav_how_it_works", "header")}
            >
              How it works
            </Link>
            <Link
              className="inline-block transition-all duration-200 hover:scale-[1.06] hover:text-brand-dark cursor-pointer"
              to="/about"
              onClick={() => trackClick("nav_about", "header")}
            >
              About
            </Link>
            {/* <button className="hover:text-brand-dark transition-colors" onClick={() => setShowDemo(true)}>Early Access</button> */}
            <Link
              className="inline-block transition-all duration-200 hover:scale-[1.09] hover:text-brand-dark cursor-pointer"
              to="/faq"
              onClick={() => trackClick("nav_faq", "header")}
            >
              FAQ
            </Link>
          </nav>
          
          {/* Nav Right CTA */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle (Kept for functionality) */}
            {/* <button
              className="text-gray-500 hover:text-brand-dark transition-colors hidden md:block"
              type="button"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button> */}
            <button
              className="hidden sm:inline-flex items-center gap-2 bg-brand-green hover:bg-[#257341] text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-bold shadow-sm transition-all hover:shadow hover:scale-105"
              onClick={() => {
                trackClick("join_waitlist", "header_button");
                setShowDemo(true);
              }}
            >
              <span>Join the Waitlist</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {menuOpen && (
            <div className="absolute top-[80px] left-0 right-0 bg-white shadow-md p-6 flex flex-col gap-4 text-center z-50 border-t border-gray-100 lg:hidden font-semibold text-gray-700">
              <Link
                className="inline-block transition-all duration-200 hover:scale-[1.03] hover:text-brand-dark cursor-pointer"
                to="/#how-it-works"
                onClick={() => {
                  trackClick("nav_how_it_works", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                How it works
              </Link>
              <Link
                className="inline-block transition-all duration-200 hover:scale-[1.06] hover:text-brand-dark cursor-pointer"
                to="/about"
                onClick={() => {
                  trackClick("nav_about", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                About
              </Link>
              {/* <button onClick={() => { setShowDemo(true); setMenuOpen(false); }}>Early Access</button> */}
              <Link
                className="inline-block transition-all duration-200 hover:scale-[1.09] hover:text-brand-dark cursor-pointer"
                to="/faq"
                onClick={() => {
                  trackClick("nav_faq", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                FAQ
              </Link>
            </div>
          )}
        </header>

        <main id="top" key={location.pathname}>
          {children}
        </main>

        <footer className="site-footer section-wrap">
          <Link
            className="brand"
            to="/"
            onClick={() => trackClick("brand_logo", "footer")}
          >
            <SpectaklesLogo height={38} className="h-9 md:h-10 w-auto" />
          </Link>
          <p>Learning should have a little more life in it.</p>
          <div className="footer-links">
            <Link
              to="/#how-it-works"
              onClick={() => trackClick("nav_how_it_works", "footer")}
            >
              How it works
            </Link>
            <Link
              to="/about"
              onClick={() => trackClick("nav_about", "footer")}
            >
              About
            </Link>
            <Link
              to="/faq"
              onClick={() => trackClick("nav_faq", "footer")}
            >
              FAQ
            </Link>
            <button
              onClick={() => {
                trackClick("join_waitlist", "footer_button");
                setShowDemo(true);
              }}
            >
              Join the waitlist
            </button>
          </div>
          <span className="copyright">
            © 2026 Spectakles. Made for better conversations.
          </span>
        </footer>
        <WaitlistModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
      </div>
    </DemoContext.Provider>
  );
}
