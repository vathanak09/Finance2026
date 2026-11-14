/**
 * Normalizes a username by trimming whitespace and lowercasing for case-insensitive lookup.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Hashes a password/PIN string using SHA-256 via Web Crypto API.
 * Includes a deterministic fallback if crypto.subtle is unavailable in non-HTTPS contexts.
 */
export async function hashPassword(password: string): Promise<string> {
  const input = `finance2026_salt:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback FNV-1a double-pass hash when running on plain HTTP LAN IP without crypto.subtle
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x01000193);
  }
  return `fb_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}
