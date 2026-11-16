/**
 * Recursively strips `undefined` values so payloads are safe for Firebase Realtime Database.
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value
        .filter((item) => item !== undefined)
        .map((item) => stripUndefined(item)) as unknown as T;
    }

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        clean[k] = stripUndefined(v);
      }
    }
    return clean as T;
  }

  return value;
}
