import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";

const getEnv = (key: string) => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[`NEXT_PUBLIC_${key}`] || process.env[`VITE_${key}`];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("FIREBASE_APP_ID"),
  measurementId: getEnv("FIREBASE_MEASUREMENT_ID"),
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.measurementId);

let app: FirebaseApp | null = null;
let analyticsPromise: Promise<Analytics | null> = Promise.resolve(null);

if (typeof window !== "undefined" && isConfigured) {
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
} else if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
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

  if (!isConfigured || typeof window === "undefined") return;

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
    page_location: typeof window !== "undefined" ? window.location.href : "",
    page_path: path,
  });
}

export { app, analyticsPromise };
