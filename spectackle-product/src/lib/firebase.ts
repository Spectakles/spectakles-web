import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.measurementId);

let app: FirebaseApp | null = null;
let analyticsPromise: Promise<Analytics | null> = Promise.resolve(null);

if (isConfigured && typeof window !== "undefined") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    analyticsPromise = isSupported().then((supported) => {
      if (supported && app) {
        return getAnalytics(app);
      }
      return null;
    });
  } catch (error) {
    console.warn("[Firebase] Initialization error:", error);
  }
} else if (process.env.NODE_ENV === "development") {
  console.info("[Firebase Analytics] Config keys not provided in .env. Analytics calls will be safely skipped.");
}

/**
 * Logs a custom event to Firebase Analytics.
 */
export async function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[Analytics] ${eventName}`, eventParams ?? {});
  }

  if (!isConfigured) return;

  try {
    const analytics = await analyticsPromise;
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (err) {
    console.warn(`[Firebase Analytics] Failed to log event "${eventName}":`, err);
  }
}

/**
 * Tracks custom button and link click interactions.
 */
export function trackClick(
  buttonName: string,
  location: string,
  extraParams?: Record<string, any>
): void {
  trackEvent("custom_click", {
    button_name: buttonName,
    click_location: location,
    ...extraParams,
  });
}

/**
 * Tracks page view transitions across routes.
 */
export function trackPageView(pageTitle: string, path: string): void {
  trackEvent("page_view", {
    page_title: pageTitle,
    page_location: window.location.href,
    page_path: path,
  });
}

export { app, analyticsPromise };
