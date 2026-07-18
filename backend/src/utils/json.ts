// SQLite has no native array column type, so string[] fields (like Trip.interests)
// are stored as a JSON-encoded string and converted at the API boundary.

export function encodeStringArray(arr: string[] | undefined | null): string {
  return JSON.stringify(arr ?? []);
}

export function decodeStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
