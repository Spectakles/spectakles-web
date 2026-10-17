"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import Link from "./SiteLink";
import { usePathname } from "next/navigation";
import WaitlistModal from "./WaitlistModal";
import SpectaklesLogo from "./SpectaklesLogo";
import Footer from "./Footer";
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

const DemoContext = createContext<(open: boolean) => void>(() => { });

export function useDemo() {
  return useContext(DemoContext);
}

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const pathname = usePathname();

  const openDemo = (open: boolean) => setShowDemo(open);


  return (
    <DemoContext.Provider value={openDemo}>
      <div className="site-shell">
        {/* Floating Capsule Sticky Navbar */}
        <header className="floating-navbar-wrapper" aria-label="Main Navigation">
          <div className="floating-navbar-pill">
            {/* Left: Brand Logo */}
            <Link
              className="navbar-brand-link"
              href="/"
              aria-label="Spectakles home"
              onClick={() => trackClick("brand_logo", "header")}
            >
              <SpectaklesLogo
                height={26}
                variant="white"
                className="navbar-logo-img"
              />
            </Link>

            {/* Center: Navigation Links */}
            <nav className="navbar-nav-links" aria-label="Desktop Navigation">
              <Link
                className="navbar-nav-link"
                href="/#how-it-works"
                onClick={() => trackClick("nav_how_it_works", "header")}
              >
                How it works
              </Link>
              <Link
                className="navbar-nav-link"
                href="/#institutions"
                onClick={() => trackClick("nav_institutions", "header")}
              >
                The GD Reality
              </Link>
              <Link
                className="navbar-nav-link"
                href="/about"
                onClick={() => trackClick("nav_about", "header")}
              >
                About
              </Link>
              <Link
                className="navbar-nav-link"
                href="/faq"
                onClick={() => trackClick("nav_faq", "header")}
              >
                FAQ
              </Link>
            </nav>

            {/* Right: CTA Pill Button + Mobile Hamburger */}
            <div className="navbar-right-group">
              <button
                type="button"
                className="navbar-cta-button"
                onClick={() => {
                  trackClick("book_call", "header_button");
                  setShowDemo(true);
                }}
              >
                Join the Waitlist
              </button>

              <button
                type="button"
                className="navbar-mobile-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown Card */}
          {menuOpen && (
            <div className="navbar-mobile-menu">
              <Link
                className="navbar-mobile-link"
                href="/#how-it-works"
                onClick={() => {
                  trackClick("nav_how_it_works", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                How it works
              </Link>
              <Link
                className="navbar-mobile-link"
                href="/#institutions"
                onClick={() => {
                  trackClick("nav_institutions", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                The GD Reality
              </Link>
              <Link
                className="navbar-mobile-link"
                href="/about"
                onClick={() => {
                  trackClick("nav_about", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                About
              </Link>
              <Link
                className="navbar-mobile-link"
                href="/faq"
                onClick={() => {
                  trackClick("nav_faq", "mobile_menu");
                  setMenuOpen(false);
                }}
              >
                FAQ
              </Link>
              <button
                type="button"
                className="navbar-mobile-cta"
                onClick={() => {
                  trackClick("book_call", "mobile_menu");
                  setShowDemo(true);
                  setMenuOpen(false);
                }}
              >
                Join the Waitlist
              </button>
            </div>
          )}
        </header>

        <main id="top" key={pathname} className="site-main-content">
          {children}
        </main>

        <Footer onOpenWaitlist={() => setShowDemo(true)} />
        <WaitlistModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
      </div>
    </DemoContext.Provider>
  );
}
