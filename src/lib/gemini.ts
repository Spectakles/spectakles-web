/**
 * Google Gemini configuration & environment helper
 * Supports Next.js server-side, client-side (NEXT_PUBLIC_), and fallback naming.
 */

const getEnv = (key: string) => {
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env[`NEXT_PUBLIC_${key}`] ||
      process.env[key] ||
      process.env[`VITE_${key}`]
    );
  }
  return undefined;
};

export const geminiConfig = {
  apiKey: getEnv("GEMINI_API_KEY"),
  model: getEnv("GEMINI_MODEL") || "gemini-2.5-flash",
};

export const isGeminiConfigured = Boolean(geminiConfig.apiKey);
