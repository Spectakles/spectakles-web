import type { Metadata } from 'next';

// Preserve the original shared shell and HTTP 200 fallback, but keep empty URLs
// out of search results instead of giving them the homepage's canonical metadata.
export const metadata: Metadata = {
  title: { absolute: 'Page unavailable | Spectakles' },
  description: null,
  robots: { index: false, follow: true },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
  other: { 'twitter:url': [] },
};

export default function UnmatchedPage() {
  return null;
}
