import fs from "node:fs";
import path from "node:path";

/**
 * Runtime JSON store used by the CMS data modules.
 *
 * The admin panel writes `src/data/*.json` and the site reads those same
 * files at request time. Parsed payloads are cached per file and invalidated
 * whenever the file's mtime or size changes, so content edits show up
 * without restarting the server or rebuilding the app.
 */
interface CacheEntry {
  mtimeMs: number;
  size: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();

function resolveDataFile(rel: string): string {
  const candidates = [
    path.join(process.cwd(), "src", "data", rel),
    path.join(process.cwd(), "data", rel),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // try next candidate
    }
  }
  throw new Error(`CMS data file not found: ${rel} (searched ${candidates.join(", ")})`);
}

export function loadDataJson<T>(rel: string): T {
  const file = resolveDataFile(rel);
  const stat = fs.statSync(file);
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) {
    return hit.data as T;
  }
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw) as T;
  cache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, data });
  return data;
}

/** Same as loadDataJson, but returns `fallback` when the file does not exist. */
export function loadDataJsonOptional<T>(rel: string, fallback: T): T {
  try {
    return loadDataJson<T>(rel);
  } catch {
    return fallback;
  }
}

/** True when the cached payload for `rel` is still current. */
export function isDataCurrent(rel: string, knownMtimeMs: number, knownSize: number): boolean {
  try {
    const stat = fs.statSync(resolveDataFile(rel));
    return stat.mtimeMs === knownMtimeMs && stat.size === knownSize;
  } catch {
    return false;
  }
}
