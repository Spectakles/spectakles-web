import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/firebase";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = document.title || "Spectakles";
    const currentPath = location.pathname + location.search + location.hash;
    trackPageView(pageTitle, currentPath);
  }, [location]);

  return null;
}
