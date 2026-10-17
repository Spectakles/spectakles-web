import type { Metadata } from 'next';

// The production non-www host redirects here. Keep canonical URLs redirect-free.
export const SITE_ORIGIN = 'https://www.spectakles.in';
export const SITE_NAME = 'Spectakles';

export const pages = {
  '/': {
    title: 'AI Group Discussion Practice for Placements | Spectakles',
    description: 'Practice group discussions with AI personas, realistic interruptions, and instant feedback. Build speaking confidence and prepare for campus placement GDs with Spectakles.',
    type: 'WebPage',
  },
  '/about': {
    title: 'About Spectakles | AI Group Discussion Practice',
    description: 'Learn why we built Spectakles: to help students speak up under pressure, practice real group discussions, and build confidence for campus placements.',
    type: 'AboutPage',
  },
  '/faq': {
    title: 'Spectakles FAQs | AI Group Discussion & Placement Prep',
    description: 'Find answers about Spectakles group discussion practice, AI personas, voice-based sessions, placement scorecards, student privacy, and campus setup.',
    type: 'WebPage',
  },
} as const;

export type PagePath = keyof typeof pages;

export function pageMetadata(path: PagePath): Metadata {
  const { title, description } = pages[path];
  const url = SITE_ORIGIN + path;
  const image = { url: `${SITE_ORIGIN}/og-image.png`, width: 1200, height: 630,
    alt: 'Spectakles — Stop Rehearsing. Start Speaking.' };
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: { absolute: title },
    description,
    applicationName: SITE_NAME,
    alternates: { canonical: url },
    robots: { index: process.env.VERCEL_ENV !== 'preview', follow: true, 'max-image-preview': 'large' },
    openGraph: { type: 'website', locale: 'en_IN', siteName: SITE_NAME, url, title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    other: { 'twitter:url': url },
  };
}

export const siteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`,
      name: SITE_NAME, url: `${SITE_ORIGIN}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/apple-touch-icon.png`, width: 180, height: 180 },
      description: 'Spectakles is the AI roundtable platform for Group Discussions. Practice real conversations, handle pressure, and walk into placements ready to speak.',
    },
    {
      '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`, name: SITE_NAME, inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
  ],
};

export function pageStructuredData(path: PagePath) {
  const page = pages[path];
  const url = SITE_ORIGIN + path;
  return {
    '@context': 'https://schema.org', '@type': page.type, '@id': `${url}#webpage`,
    url, name: page.title, description: page.description, inLanguage: 'en-IN',
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': `${SITE_ORIGIN}/#organization` },
  };
}

export function serializeStructuredData(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
