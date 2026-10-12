import { cookies } from "next/headers";

const SESSION_COOKIE = "spectakles_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): string {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "spectakles-fallback-secret-key-min-32-chars-2026"
  );
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@spectakles.in",
    password: process.env.ADMIN_PASSWORD || "spectakles2026!admin",
  };
}

async function signToken(payload: { email: string; exp: number }): Promise<string> {
  const encoder = new TextEncoder();
  const data = JSON.stringify(payload);
  const base64Data = Buffer.from(data).toString("base64url");
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecretKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(base64Data)
  );

  const base64Signature = Buffer.from(signature).toString("base64url");
  return `${base64Data}.${base64Signature}`;
}

async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const [base64Data, base64Signature] = token.split(".");
    if (!base64Data || !base64Signature) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getSecretKey()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Buffer.from(base64Signature, "base64url"),
      encoder.encode(base64Data)
    );

    if (!valid) return null;

    const payload = JSON.parse(
      Buffer.from(base64Data, "base64url").toString("utf-8")
    );

    if (!payload.exp || Date.now() > payload.exp) return null;

    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function createAdminSession(email: string) {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const token = await signToken({ email, exp });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return token;
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return false;

    const result = await verifyToken(token);
    return result !== null;
  } catch {
    return false;
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
