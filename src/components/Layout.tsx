"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WaitlistModal from "./WaitlistModal";
import SpectaklesLogo from "./SpectaklesLogo";
import { trackClick } from "../lib/firebase";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "For institutions", href: "/#institutions" },
  { label: "Student experience", href: "/#experience" },
  { label: "Impact", href: "/impact" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
];

const DemoContext = createContext<(open: boolean) => void>(() => {});

export function useDemo() {
  return useContext(DemoContext);
}

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();

  const openDemo = (open: boolean) => setShowDemo(open);

  useEffect(() => {
    const savedTheme = localStorage.getItem("Spectakles-theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("Spectakles-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    setMenuOpen(false);
    if (typeof window !== "undefined" && window.location.hash) {
      const element = document.getElementById(window.location.hash.slice(1));
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return (
      <DemoContext.Provider value={openDemo}>
        <div className="admin-shell">
          <main id="top">{children}</main>
        </div>
      </DemoContext.Provider>
    );
  }

  return (
    <DemoContext.Provider value={openDemo}>
      <div className="site-shell">
        <header className="relative section-wrap py-6 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            className="flex items-center gap-2.5 group"
            href="/"
            aria-label="Spectakles home"
            onClick={() => trackClick("brand_logo", "header")}
          >
            <SpectaklesLogo
              height={36}
              className="h-9 w-auto group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-7 text-[13.5px] font-semibold text-gray-700"
            aria-label="Main navigation"
          >
            <Link
              className="hover:text-brand-dark transition-colors"
              href="/#how-it-works"
              onClick={() => trackClick("nav_how_it_works", "header")}
            >
              How it works
            </Link>
            <Link
              className="hover:text-brand-dark transition-colors"
              href="/about"
              onClick={() => trackClick("nav_about", "header")}
            >
              About
            </Link>
            <Link
              className="hover:text-brand-dark transition-colors"
              href="/faq"
              onClick={() => trackClick("nav_faq", "header")}
            >
              FAQ
            </Link>
            <Link
              className="hover:text-brand-dark transition-colors"
              href="/blog"
              onClick={() => trackClick("nav_blog", "header")}
            >
              Blog
            </Link>
          </nav>

          {/* Nav Right CTA */}
          <div className="flex items-center gap-4">
            <button
              className="hidden sm:inline-flex items-center gap-2 bg-brand-green hover:bg-[#257341] text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-bold shadow-sm transition-all hover:shadow hover:scale-105"
              onClick={() => {
                trackClick("join_waitlist", "header_button");
                setShowDemo(true);
              }}
            >
              <span>Join the Waitlist</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
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
                href="/#how-it-works"
                onClick={() => {
                  trackClick("nav_how_it_works", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                How it works
              </Link>
              <Link
                href="/about"
                onClick={() => {
                  trackClick("nav_about", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                About
              </Link>
              <Link
                href="/faq"
                onClick={() => {
                  trackClick("nav_faq", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                FAQ
              </Link>
              <Link
                href="/blog"
                onClick={() => {
                  trackClick("nav_blog", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                Blog
              </Link>
            </div>
          )}
        </header>

        <main id="top" key={pathname}>
          {children}
        </main>

        <footer className="site-footer section-wrap">
          <Link
            className="brand"
            href="/"
            onClick={() => trackClick("brand_logo", "footer")}
          >
            <SpectaklesLogo height={38} className="h-9 md:h-10 w-auto" />
          </Link>
          <p>Learning should have a little more life in it.</p>
          <div className="footer-links">
            <Link
              href="/#how-it-works"
              onClick={() => trackClick("nav_how_it_works", "footer")}
            >
              How it works
            </Link>
            <Link
              href="/about"
              onClick={() => trackClick("nav_about", "footer")}
            >
              About
            </Link>
            <Link href="/faq" onClick={() => trackClick("nav_faq", "footer")}>
              FAQ
            </Link>
            <Link href="/blog" onClick={() => trackClick("nav_blog", "footer")}>
              Blog
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
