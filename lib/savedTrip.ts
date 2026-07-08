/**
 * v1 saved-trip store: plain localStorage, no auth, no backend. Holds two kinds
 * of items — verified places from our dataset (by id, so their verdict is always
 * recomputed fresh) and "unverified" pasted items we couldn't match. Kept tiny
 * and swappable for a real backend / synced offline cache later.
 */
const KEY = "routt.savedPlaces";

export type SavedItem =
  | { kind: "place"; id: string; savedAt: number }
  | { kind: "unverified"; id: string; name: string; sourceUrl?: string; savedAt: number };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function read(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable — non-fatal in v1 */
  }
}

/** All saved items, newest first. */
export function getSaved(): SavedItem[] {
  return read().sort((a, b) => b.savedAt - a.savedAt);
}

export function isSaved(id: string): boolean {
  return read().some((i) => i.kind === "place" && i.id === id);
}

/** Ensure a dataset place is saved. No-op if already present. */
export function savePlace(id: string): void {
  const items = read();
  if (items.some((i) => i.kind === "place" && i.id === id)) return;
  items.push({ kind: "place", id, savedAt: Date.now() });
  write(items);
}

/** Toggle a dataset place (used by the detail screen). Returns new saved state. */
export function toggleSaved(id: string): boolean {
  const items = read();
  const existing = items.find((i) => i.kind === "place" && i.id === id);
  if (existing) {
    write(items.filter((i) => i !== existing));
    return false;
  }
  items.push({ kind: "place", id, savedAt: Date.now() });
  write(items);
  return true;
}

/** Add an unverified pasted item. Deduped by name; returns the stored item. */
export function addUnverified(name: string, sourceUrl?: string): SavedItem {
  const items = read();
  const dupe = items.find((i) => i.kind === "unverified" && norm(i.name) === norm(name));
  if (dupe) return dupe;
  const item: SavedItem = { kind: "unverified", id: `unv-${Date.now()}`, name, sourceUrl, savedAt: Date.now() };
  items.push(item);
  write(items);
  return item;
}

export function removeSaved(id: string): void {
  write(read().filter((i) => i.id !== id));
}
