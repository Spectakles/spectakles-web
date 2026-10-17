import type { ReactNode } from 'react';
import SiteShell from './site-shell';
import StructuredData from './structured-data';
import { pageMetadata, siteStructuredData } from '@/lib/seo';
import './fonts.css';
// Keep the original Vite cascade order; global overrides remain last.
import '../components/WaitlistModal.css';
import '../components/Footer.css';
import '../components/FloatingNavbar.css';
import '../components/CreativeExperience.css';
import '../components/InstitutionsBento.css';
import '../components/MagicBento.css';
import '../components/ParallaxPills.css';
import '../components/ScrollPortalLayout.css';
import '../components/TypingText.css';
import '../components/AsciiWavesBackground.css';
import '../index.css';
import '../components/InstitutionsBentoResponsive.css';

export const metadata = {
  ...pageMetadata('/'),
  icons: {
    icon: { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
};

// Apply the existing stored theme before the page paints; do not change its palette.
const themeBootstrap = `try { var theme = localStorage.getItem('Spectakles-theme') === 'dark' ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; localStorage.setItem('Spectakles-theme', theme); } catch { document.documentElement.dataset.theme = 'light'; }`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="preload" href="https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4C_k3HqU.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
<link rel="preload" href="https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
<link rel="preload" href="https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
<link rel="preload" href="https://fonts.gstatic.com/s/dmmono/v16/aFTR7PB1QTsUX8KYvumzEYOtbYf-Vlg.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <StructuredData data={siteStructuredData} />
      </head>
      <body><div id="root"><SiteShell>{children}</SiteShell></div></body>
    </html>
  );
}
