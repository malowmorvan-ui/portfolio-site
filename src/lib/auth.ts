/**
 * Minimal signed-cookie session, no database and no auth library needed.
 * Works both in Next.js middleware (Edge runtime) and route handlers
 * (Node runtime) because it only relies on the standard Web Crypto API,
 * which both runtimes expose as `crypto.subtle`.
 */

export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET environment variable. Set it to any long random string."
    );
  }
  return secret;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(data: string): Promise<string> {
  const key = await importKey(getSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return toHex(signature);
}

export async function createSessionCookieValue(): Promise<string> {
  const expiry = Date.now() + SESSION_TTL_MS;
  const signature = await sign(String(expiry));
  return `${expiry}.${signature}`;
}

export async function isSessionValid(
  cookieValue: string | undefined | null
): Promise<boolean> {
  if (!cookieValue) return false;
  const [expiryStr, signature] = cookieValue.split(".");
  if (!expiryStr || !signature) return false;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const expected = await sign(expiryStr);
  return expected === signature;
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error(
      "Missing ADMIN_PASSWORD environment variable. Set it to the password you want to log into /admin with."
    );
  }
  return candidate === expected;
}
