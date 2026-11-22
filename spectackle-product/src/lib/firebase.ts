import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { initializeAnalytics, isSupported, logEvent, setAnalyticsCollectionEnabled, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const marketingPages = new Set(["/", "/experience", "/institutions", "/contact", "/about", "/faq", "/pricing"]);
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.measurementId);
let app: FirebaseApp | null = null;
let analyticsPromise: Promise<Analytics | null> | undefined;

async function initializeMarketingAnalytics(): Promise<Analytics | null> {
  if (!isConfigured || !marketingPages.has(window.location.pathname)) return null;
  if (!await isSupported() || !marketingPages.has(window.location.pathname)) return null;
  try {
    app = getApps().find(candidate => candidate.name === "[DEFAULT]") ?? initializeApp(firebaseConfig);
    return initializeAnalytics(app, { config: { send_page_view: false,
      page_location: window.location.origin + window.location.pathname, page_referrer: "" } });
  } catch {
    return null;
  }
}

async function marketingAnalytics() {
  analyticsPromise ??= initializeMarketingAnalytics();
  const analytics = await analyticsPromise;
  if (!analytics) analyticsPromise = undefined;
  return analytics;
}

export async function trackEvent(eventName: string, eventParams?: Record<string, unknown>): Promise<void> {
  if (!marketingPages.has(window.location.pathname)) return;
  try {
    const analytics = await marketingAnalytics();
    if (analytics && marketingPages.has(window.location.pathname)) {
      logEvent(analytics, eventName, { ...eventParams, page_location: window.location.origin + window.location.pathname,
        page_referrer: "" });
    }
  } catch {
    // Analytics failures must not interrupt the page.
  }
}

export function trackClick(buttonName: string, location: string, extraParams?: Record<string, unknown>): void {
  void trackEvent("custom_click", { button_name: buttonName, click_location: location, ...extraParams });
}

export function trackPageView(pageTitle: string, path: string): void {
  const enabled = marketingPages.has(path);
  const active = enabled ? marketingAnalytics() : analyticsPromise;
  void active?.then(analytics => {
    if (!analytics || path !== window.location.pathname) return;
    setAnalyticsCollectionEnabled(analytics, enabled);
    if (enabled) void trackEvent("page_view", { page_title: pageTitle, page_path: path });
  }).catch(() => undefined);
}

export { app, analyticsPromise };
