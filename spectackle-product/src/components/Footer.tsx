"use client";

import Link from "./SiteLink";
import { trackClick } from "../lib/firebase";
import SpectaklesLogo from "./SpectaklesLogo";

interface FooterProps {
  onOpenWaitlist: () => void;
}

export default function Footer({ onOpenWaitlist }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="spectakles-footer" id="site-footer">
      <div className="spectakles-footer-inner">
        {/* TOP ROW: BRAND INFO (LEFT) + 4 LINK COLUMNS (RIGHT) */}
        <div className="footer-top-grid">
          {/* LEFT: BRAND & COPYRIGHT */}
          <div className="footer-brand-column">
            <Link
              href="/"
              className="footer-brand-link"
              aria-label="Spectakles home"
              onClick={() => trackClick("brand_logo", "footer")}
            >
              <SpectaklesLogo
                height={32}
                variant="white"
                className="footer-brand-logo"
              />
            </Link>

            <p className="footer-copyright-text">
              &copy; copyright Spectakles {currentYear}. All rights reserved.
            </p>
          </div>

          {/* RIGHT: 4 NAVIGATION COLUMNS */}
          <div className="footer-nav-columns">
            {/* COLUMN 1: PAGES */}
            <div className="footer-nav-group">
              <h4 className="footer-group-heading">Pages</h4>
              <ul className="footer-links-list">
                <li>
                  <Link href="/#practice" onClick={() => trackClick("nav_features", "footer")}>
                    All Features
                  </Link>
                </li>
                <li>
                  <Link href="/#institutions" onClick={() => trackClick("nav_gd_reality", "footer")}>
                    The GD Reality
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" onClick={() => trackClick("nav_how_it_works", "footer")}>
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" onClick={() => trackClick("nav_pricing", "footer")}>
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/faq" onClick={() => trackClick("nav_faq", "footer")}>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/about" onClick={() => trackClick("nav_about", "footer")}>
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 2: SOCIALS */}
            <div className="footer-nav-group">
              <h4 className="footer-group-heading">Socials</h4>
              <ul className="footer-links-list">
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick("social_linkedin", "footer")}
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick("social_twitter", "footer")}
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick("social_instagram", "footer")}
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick("social_youtube", "footer")}
                  >
                    YouTube
                  </a>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: LEGAL */}
            <div className="footer-nav-group">
              <h4 className="footer-group-heading">Legal</h4>
              <ul className="footer-links-list">
                <li>
                  <Link href="/faq#privacy" onClick={() => trackClick("legal_privacy", "footer")}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/faq#terms" onClick={() => trackClick("legal_terms", "footer")}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/faq#cookies" onClick={() => trackClick("legal_cookies", "footer")}>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: REGISTER */}
            <div className="footer-nav-group">
              <h4 className="footer-group-heading">Register</h4>
              <ul className="footer-links-list">
                <li>
                  <button
                    type="button"
                    className="footer-btn-link highlight"
                    onClick={() => {
                      trackClick("join_waitlist", "footer_register");
                      onOpenWaitlist();
                    }}
                  >
                    Sign Up
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-btn-link"
                    onClick={() => {
                      trackClick("student_login", "footer_register");
                      onOpenWaitlist();
                    }}
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-btn-link"
                    onClick={() => {
                      trackClick("forgot_password", "footer_register");
                      onOpenWaitlist();
                    }}
                  >
                    Forgot Password
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM MASSIVE WORDMARK WATERMARK */}
      <div className="footer-watermark-wrap" aria-hidden="true">
        <span className="footer-watermark-text">SPECTAKLES</span>
      </div>
    </footer>
  );
}
