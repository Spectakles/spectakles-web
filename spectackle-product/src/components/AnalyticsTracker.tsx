"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '../lib/firebase';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string | null>(null);
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const navigate = (event?: Event) => {
      clearTimeout(timer);
      if (previousPath.current !== window.location.pathname) {
        window.scrollTo(0, 0);
        previousPath.current = window.location.pathname;
      }
      const { pathname: path, search, hash } = window.location;
      // A popstate update also updates Next's hooks; count that navigation once.
      if (lastTrackedUrl.current !== window.location.href || event?.type === 'spectakles:navigation') {
        trackPageView(document.title || 'Spectakles', path + search + hash);
        lastTrackedUrl.current = window.location.href;
      }
      if (hash) {
        let attempts = 0;
        const scrollToHash = () => {
          const element = document.getElementById(hash.slice(1));
          if (element) element.scrollIntoView({ behavior: 'smooth' });
          else if (++attempts < 20) timer = setTimeout(scrollToHash, 100);
        };
        timer = setTimeout(scrollToHash, 100);
      }
    };
    window.history.scrollRestoration = 'manual';
    navigate();
    window.addEventListener('hashchange', navigate);
    window.addEventListener('popstate', navigate);
    window.addEventListener('spectakles:navigation', navigate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', navigate);
      window.removeEventListener('popstate', navigate);
      window.removeEventListener('spectakles:navigation', navigate);
    };
  }, [pathname, searchParams]);
  return null;
}
