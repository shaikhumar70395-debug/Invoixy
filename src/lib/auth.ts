// Use standard Web Crypto API which works in both Node.js and Edge Runtime (for Middleware)

const ENCODER = new TextEncoder();
const SECRET_KEY_STRING = process.env.AUTH_SECRET || "default_super_secret_key_123!@#";

// Utility to get a crypto key for HMAC signing
async function getSigningKey() {
  const secretBuffer = ENCODER.encode(SECRET_KEY_STRING);
  return crypto.subtle.importKey(
    "raw",
    secretBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert Hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return result;
}

/**
 * Hashes a password/PIN using SHA-256.
 * In a real-world multi-user app, we'd use bcrypt/Argon2 with salt.
 * For this single-user app with a simple PIN, SHA-256 is sufficient to avoid plain text in DB.
 */
export async function hashPassword(password: string): Promise<string> {
  const data = ENCODER.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}

/**
 * Verifies a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

function toBase64Url(str: string): string {
  const bytes = ENCODER.encode(str);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  try {
    let str = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return atob(b64);
  }
}

export interface UserSession {
  userId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  activeShopId: string;
  activeShopName: string;
  role?: string;
}

/**
 * Signs a payload string or object to create a secure token.
 * Format: payloadB64.signatureHex
 */
export async function signToken(payload: string | UserSession): Promise<string> {
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  const key = await getSigningKey();
  const data = ENCODER.encode(payloadStr);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const signatureHex = bufferToHex(signatureBuffer);
  
  const payloadB64 = toBase64Url(payloadStr);
  return `${payloadB64}.${signatureHex}`;
}

/**
 * Verifies a token and returns the payload if valid.
 */
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    
    const [payloadB64, signatureHex] = parts;
    const payloadStr = fromBase64Url(payloadB64);
    
    const key = await getSigningKey();
    const data = ENCODER.encode(payloadStr);
    const signatureUint8 = hexToUint8Array(signatureHex);
    
    const isValid = await crypto.subtle.verify("HMAC", key, signatureUint8 as BufferSource, data);
    
    return isValid ? payloadStr : null;
  } catch {
    return null;
  }
}

