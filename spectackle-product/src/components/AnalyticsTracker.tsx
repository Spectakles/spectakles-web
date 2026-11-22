import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/firebase";

export default function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = document.title || "Spectakles";
    trackPageView(pageTitle, pathname);
  }, [pathname]);

  return null;
}
