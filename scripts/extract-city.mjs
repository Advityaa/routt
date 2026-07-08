/**
 * Routt EXTRACT job — Overture Places → our own store.
 *
 * Overture is NOT a runtime API: it's bulk GeoParquet on S3. This offline job
 * pulls one city's places (by bbox) with DuckDB and writes data/venues/<city>.json
 * — the owned "venue skeleton" the app serves from (no rate limits, no per-call
 * cost). First-party UGC lives SEPARATELY in data/signals/ keyed by GERS id, so
 * re-running this job never touches our proprietary signals.
 *
 * Usage:   node scripts/extract-city.mjs bangkok
 * Refresh: same command — venues are fully replaced (upsert-by-gers_id happens
 *          implicitly since the file is keyed content), signals are untouched.
 *
 * Release discovery: public releases are retained ~60 days, so we NEVER
 * hardcode one — we list the S3 release/ prefix and take the latest, unless
 * OVERTURE_RELEASE is set explicitly.
 *
 * Columns: id (GERS), names.primary, basic_category + taxonomy (NOT the
 * deprecated `categories`, removed Sep 2026 — we fall back to it, with a loud
 * warning, only if the release predates basic_category), geometry, addresses,
 * websites, phones, confidence.
 */
import { DuckDBInstance } from "@duckdb/node-api";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const S3_HTTP = "https://overturemaps-us-west-2.s3.amazonaws.com";

const cityKey = process.argv[2];
const cities = JSON.parse(readFileSync(join(ROOT, "config/cities.json"), "utf8"));
if (!cityKey || !cities[cityKey]) {
  console.error(`usage: node scripts/extract-city.mjs <city>  (known: ${Object.keys(cities).filter((k) => !k.startsWith("_")).join(", ")})`);
  process.exit(1);
}
const city = cities[cityKey];
const [west, south, east, north] = city.bbox;

/** Latest release, discovered from the public S3 listing (no hardcoding). */
async function latestRelease() {
  if (process.env.OVERTURE_RELEASE) return process.env.OVERTURE_RELEASE;
  const xml = await (await fetch(`${S3_HTTP}/?list-type=2&prefix=release/&delimiter=/`)).text();
  const releases = [...xml.matchAll(/<Prefix>release\/([^<]+)\/<\/Prefix>/g)].map((m) => m[1]);
  if (!releases.length) throw new Error("could not list Overture releases");
  return releases.sort().at(-1);
}

const release = await latestRelease();
const glob = `s3://overturemaps-us-west-2/release/${release}/theme=places/type=place/*.parquet`;
console.log(`[extract] city=${cityKey} bbox=${city.bbox.join(",")} release=${release}`);

const instance = await DuckDBInstance.create(":memory:");
const db = await instance.connect();
await db.run("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs;");
await db.run("SET s3_region='us-west-2';");

// Discover the schema of THIS release so we use basic_category/taxonomy when
// present and only fall back to the deprecated field on old releases.
const desc = await db.runAndReadAll(`DESCRIBE SELECT * FROM read_parquet('${glob}') LIMIT 0`);
const cols = new Set(desc.getRows().map((r) => String(r[0])));
let catExpr;
if (cols.has("basic_category")) {
  catExpr = { basic: "basic_category", tax: cols.has("taxonomy") ? "to_json(taxonomy)" : "NULL" };
} else {
  console.warn("[extract] WARNING: release lacks basic_category — falling back to DEPRECATED categories.primary (removed Sep 2026). Re-extract on a newer release.");
  catExpr = { basic: "categories.primary", tax: "to_json(categories.alternate)" };
}
const geomExpr = String(desc.getRows().find((r) => String(r[0]) === "geometry")?.[1] ?? "").includes("GEOMETRY")
  ? "geometry"
  : "ST_GeomFromWKB(geometry)";

const sql = `
  SELECT
    id                                   AS gers_id,
    to_json(names)                       AS names_json,
    ${catExpr.basic}                     AS basic_category,
    ${catExpr.tax}                       AS taxonomy,
    ST_Y(${geomExpr})                    AS lat,
    ST_X(${geomExpr})                    AS lng,
    addresses[1].freeform                AS address,
    addresses[1].locality                AS locality,
    websites[1]                          AS website,
    phones[1]                            AS phone,
    confidence
  FROM read_parquet('${glob}', filename=false, hive_partitioning=true)
  WHERE bbox.xmin > ${west} AND bbox.xmax < ${east}
    AND bbox.ymin > ${south} AND bbox.ymax < ${north}
`;

console.log("[extract] querying Overture (bbox pushdown — transfers only matching row groups)…");
const t0 = Date.now();
const reader = await db.runAndReadAll(sql);
const rows = reader.getRowObjects();
console.log(`[extract] ${rows.length} places in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

/** Display-name priority: names.common['en'] → any latin-script variant →
 *  names.primary (never blank). Handles map & list shapes of `common`. */
const LATIN = /^[\u0020-\u024F\u1E00-\u1EFF\u2018-\u201D\d\s'&.,()\-\/!+:]*$/u;
const isLatin = (t) => Boolean(t) && LATIN.test(t);
function pickNames(namesJson) {
  if (!namesJson) return { display: null, local: null };
  let n; try { n = JSON.parse(namesJson); } catch { return { display: null, local: null }; }
  const primary = n?.primary ?? null;
  const common = n?.common ?? null;
  let en = null; const latins = [];
  if (common && typeof common === "object") {
    const entries = Array.isArray(common)
      ? common.map((e) => [e?.language, e?.value])
      : Object.entries(common);
    for (const [langRaw, val] of entries) {
      const lang = String(langRaw ?? "").toLowerCase();
      if (!val) continue;
      if (lang === "en" || lang.startsWith("en-")) en = en ?? String(val);
      if (isLatin(String(val))) latins.push(String(val));
    }
  }
  const display = en ?? (isLatin(primary) ? primary : latins[0] ?? primary);
  return { display: display ?? null, local: primary ?? null };
}

const out = {
  schema_version: 1,
  city: cityKey,
  city_name: city.name,
  bbox: city.bbox,
  release,
  extracted_at: new Date().toISOString(),
  // CDLA-Permissive-2.0 — attribution shown in-app; see README "Licensing".
  attribution: "Place data © Overture Maps Foundation (CDLA Permissive 2.0)",
  venues: rows.map((r) => {
    const { display, local } = pickNames(r.names_json == null ? null : String(r.names_json));
    return {
    gers_id: String(r.gers_id),
    // `name` = English/romanized display name; `name_local` = names.primary
    // (local script) — useful to show a taxi driver. Falls back to local when
    // no latin variant exists (never blank).
    name: display,
    name_local: local,
    basic_category: r.basic_category == null ? null : String(r.basic_category),
    taxonomy: r.taxonomy == null ? null : String(r.taxonomy),
    lat: Number(r.lat),
    lng: Number(r.lng),
    address: r.address == null ? null : String(r.address),
    locality: r.locality == null ? null : String(r.locality),
    website: r.website == null ? null : String(r.website),
    phone: r.phone == null ? null : String(r.phone),
    confidence: r.confidence == null ? null : Number(r.confidence),
    source: "overture",
    last_synced: new Date().toISOString(),
  };
  }).filter((v) => v.name),
};

mkdirSync(join(ROOT, "data/venues"), { recursive: true });
const outPath = join(ROOT, `data/venues/${cityKey}.json`);
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`[extract] wrote ${out.venues.length} venues → ${outPath}`);
db.closeSync();
