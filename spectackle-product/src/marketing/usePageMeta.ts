import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const root = 'https://spectakles.in';
/** Public-route metadata only; no account or session data is included. */
export function usePageMeta(title: string, description: string, noindex = false) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title;
    const values = [
      ['name', 'description', description],
      ['name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'],
      ['property', 'og:title', title], ['property', 'og:description', description],
      ['property', 'og:url', root + pathname], ['name', 'twitter:title', title],
      ['name', 'twitter:description', description], ['name', 'twitter:url', root + pathname],
    ];
    for (const [attribute, key, value] of values) {
      let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, key); document.head.append(meta); }
      meta.content = value;
    }
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = root + pathname;
    return () => {
      // Do not leave a marketing title on the account/discussion route.
      document.title = 'Spectakles';
    };
  }, [title, description, pathname, noindex]);
}
