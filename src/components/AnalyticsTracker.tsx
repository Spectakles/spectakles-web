"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "../lib/firebase";

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const pageTitle =
      typeof document !== "undefined"
        ? document.title || "Spectakles"
        : "Spectakles";
    const queryString = searchParams?.toString()
      ? `?${searchParams.toString()}`
      : "";
    const currentPath = `${pathname}${queryString}`;
    trackPageView(pageTitle, currentPath);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}
