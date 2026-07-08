# Routt

**"Right now, near me — what's genuinely worth going to?"**

A mobile-first PWA that gives seasoned travelers a short, ranked list (3–5, never more) of
places to **Eat / Drink / Shop / See**, each carrying a **credibility verdict** — *Still good*,
*Fading*, or *Tourist trap* — so you know whether a place is actually good or just reel-famous
and now dead. Time- and location-aware, installable, and usable with zero network.

## Stack

- **Next.js 14 (App Router) + TypeScript**, deployed on Vercel
- **Tailwind CSS**, dark-first, mobile-first (designed at 360–390px)
- **State**: React + `localStorage` (no auth, no DB in v1)
- **PWA**: hand-rolled service worker (`public/sw.js`) + web manifest (`app/manifest.ts`)

## Run

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production (service-worker caching is reliable here)
npm test                     # credibility engine unit tests (vitest)
```

Dev-only helper: append `?hour=NN` (0–23) to any screen to override the time-of-day logic
(e.g. `/?hour=23` for the late-night state).

## Screens

| Route | What it is |
|---|---|
| `/` | **Now** — the live ranked feed. The app's center of gravity. |
| `/place/[id]` | Place detail: full reasoning, when-to-go, getting there & back. |
| `/trip` | Saved trip + **paste-a-link** resolver (the "is this hyped place actually good?" moment). |
| `/arrival` | Offline-survivable arrival essentials + contextual eSIM/forex affiliate links. |
| `/events` | This week's events, grouped by day. |
| `/design-system` | Internal token/component reference (noindex). |

## Architecture: one data boundary

**Nothing in the UI talks to a data source directly.** Every read goes through
[`lib/dataProvider.ts`](lib/dataProvider.ts). v1 reads the mock dataset in
[`lib/mock/`](lib/mock/) and enriches it with the credibility engine
([`lib/credibility.ts`](lib/credibility.ts)). Swapping to live data changes **only**
`dataProvider.ts` — the UI, types, and engine stay untouched.

### Swap points for real APIs

| `dataProvider` function | v1 (mock) | Real implementation |
|---|---|---|
| `getNearbyPlaces({category,lat,lng,nowHour})` | filters `lib/mock` | **Google Places** Nearby Search + Place Details, merged with **Foursquare** Places; normalize to `Place` |
| `getPlaceById({id,lat,lng})` | finds in `lib/mock` | **Google Place Details** (+ Foursquare tips) → `Place` |
| `getEventsThisWeek({lat,lng})` | `lib/mock` events | **Songkick** (or Ticketmaster) events API → `Event` |
| `getAreaLabel({lat,lng})` | nearest mock neighborhood | **Google Reverse Geocoding** → neighborhood, city |
| `resolvePastedPlace(input)` | fuzzy name match vs mock | URL unfurl (oEmbed / OG tags) → **Places Text Search** → `Place` |

The **credibility engine is source-agnostic**: it operates on a normalized `Place`
(`lib/types.ts`). As long as the adapter populates `reviews[]`, `recentReviewCount90d`,
`reviewVelocityTrend`, `crossSourceAgreement`, etc., verdicts work unchanged. The one field
that needs real derivation is `looksLocalOrTourist` per review (v1 mock sets it directly;
production would infer it from reviewer language / history / geo).

> **⚠️ The hardest real-world dependency is local-vs-tourist classification. Validate this
> FIRST when wiring real review data — the trap verdicts are only as good as this signal.**
> In the mock it's a hand-authored `"local" | "tourist"` boolean. In production it's a
> probabilistic ML call (per-review confidence), often wrong on individuals and reliable
> only in aggregate; a systematic bias (e.g. "all non-English reviews = local") would quietly
> poison every trap verdict. **Planned:** carry a per-review `localProbability` (0–1) so
> `localShare()` becomes probability-weighted and trap confidence can scale with
> classification confidence (low-confidence splits → lean "unrated", not a confident trap).
> Proposed, not yet implemented — see the banner at the top of `lib/credibility.ts`.

### Going live (real sources)

Real adapters live in `lib/sources/server/*` (Google Places, Foursquare, Reddit)
and run **only** behind `app/api/places/route.ts`. The client calls that endpoint;
the server calls the providers; **keys never reach the browser** (verified: no key
names or provider URLs in the client bundle).

```bash
cp .env.example .env.local        # fill in the keys
# set NEXT_PUBLIC_USE_MOCK=false and USE_MOCK=false to go live
npm run build && npm start
```

Compare mock vs real against the same endpoint:
```bash
curl "localhost:3000/api/places?category=eat&lat=13.7376&lng=100.5602&live=1"  # real
curl "localhost:3000/api/places?category=eat&lat=13.7376&lng=100.5602&live=0"  # mock
```
With no keys, real mode degrades gracefully to 0 places (`configured` shows which
sources are missing) — it never crashes or fabricates data.

**Caching:** resolved results are cached server-side for **24h** per
(mode, category, ~1km area) in `lib/sources/server/cache.ts`, so paid APIs aren't
hit on every request. It's in-memory/per-instance (ephemeral on serverless) —
swap for Redis/Vercel KV in production; only that file changes.

**⚠️ Weakest link — local vs tourist:** real reviews have no local/tourist label.
`lib/sources/classify.ts` is a crude FIRST-PASS heuristic (language + phrasing)
producing a `localProbability`; the engine thresholds it at 0.5. It is *not*
solved — validate and iterate this before trusting real trap verdicts.

### Where API keys go

Keys live in **`.env.local`** (gitignored) and, on Vercel, in project env vars:

```
GOOGLE_PLACES_API_KEY=
FOURSQUARE_API_KEY=
SONGKICK_API_KEY=
```

> **Important:** in v1 the provider runs client-side (mock, no secrets). Real keys must
> **not** ship to the browser. When wiring live APIs, move the `dataProvider` fetches
> **server-side** — implement each function as a Route Handler (`app/api/*`) or Server
> Action, keep the same signatures / return shapes, and have the client call those. The UI
> contract does not change.

### Mocked vs real (v1 status)

| Concern | v1 |
|---|---|
| Places / reviews / busyness | **Mocked** — `lib/mock/bangkok.ts` (24 places, one city) |
| Events | **Mocked** — 10 seeded events |
| Credibility scoring | **Real** — `lib/credibility.ts`, unit-tested, ships as-is |
| Relevance ranking, distance | **Real** — `lib/dataProvider.ts` (Haversine + weighted score) |
| Time-of-day logic | **Real** — `lib/timeContext.ts` |
| Geolocation | **Real** — browser Geolocation API, falls back to Bangkok |
| Reverse geocoding (area label) | **Mocked** — nearest known neighborhood |
| Currency conversion (THB) | **Mocked** — fixed rate in `lib/insights.ts` |
| Transit "getting back" note | **Rule-based** — `components/GettingThereBack.tsx` (Bangkok BTS hours) |
| Saved trip / hotel address | **Real** — `localStorage` |
| PWA install + offline cache | **Real** — `public/sw.js`, `app/manifest.ts` |

## PWA / offline

- Installable ("Add to Home Screen") via `app/manifest.ts` + icons in `public/icons/`.
- Service worker precaches the app shell and runtime-caches assets; the **Arrival** and
  **Trip** screens work with zero network (saved data is in `localStorage`).
- Cache is versioned (`routt-v1` in `public/sw.js`); **bump the version** when cached routes
  change so clients don't get a stale shell.

## Places data pipeline (Overture + OSM + first-party UGC)

**Overture is NOT a runtime API** — it's bulk GeoParquet on S3. We extract ahead
of time into our own store and serve from there (no rate limits, no per-call cost).

```
EXTRACT  npm run extract -- bangkok     scripts/extract-city.mjs (DuckDB + httpfs/spatial)
STORE    data/venues/<city>.json        owned venue skeleton (gitignored; reproducible)
         data/signals/<city>.json       FIRST-PARTY UGC, separate, keyed by GERS id
GAP-FILL lib/venues/nominatim.ts        OSM one-off lookups: ≤1 req/s, Routt UA, disk-cached
SERVE    GET /api/venues                city/near-me/category/id queries from OUR store
```

- **Release discovery**: the extract script lists the public S3 `release/` prefix
  and takes the latest (releases retained ~60 days — never hardcoded; override
  with `OVERTURE_RELEASE=`). Columns: GERS `id`, `names.primary`,
  `basic_category` + `taxonomy` (falls back to deprecated `categories` only on
  old releases, with a loud warning), geometry, addresses, websites, phones,
  `confidence`.
- **Refresh** = re-run the extract; venues are replaced by GERS id, and
  `data/signals/` (our proprietary layer) is untouched by design.
- **Cities**: add a bbox to `config/cities.json`, run the extract. Bangkok is
  loaded (126,864 places, release 2026-06-17.0).
- **Postgres path**: `db/schema.sql` has the PostGIS target schema (venues +
  venue_signals, GIST geography index). v1 serves from JSON; swapping stores
  changes only `lib/venues/store.ts`.
- **App wiring**: `NEXT_PUBLIC_DATA_MODE=db` switches the discovery UI to the
  venue store (skeleton has no review corpus yet → verdicts honestly show
  "Not rated yet"; seed signals carry `is_seed_demo` and are never presented as
  verified). Default remains `mock` (the demo dataset).

### Licensing (⚠️ owner review before deep merge / commercial launch)
Overture places = **CDLA Permissive 2.0**; OSM/Nominatim = **ODbL**
(share-alike). Combining them into one derivative database MAY require the
result to carry ODbL. Mitigations in place: first-party UGC lives in a
**separate table/store** (never merged into licensed venue data), OSM-derived
rows are flagged `source='osm'`, and attribution is shown in-app ("Place data ©
Overture Maps Foundation · © OpenStreetMap contributors"). **Not legal advice —
verify before launch.**

### UGC & verdicts (first-party only)
Verdicts assert ONLY from our own `venue_reviews` (never Google/FSQ content — their
terms forbid storing it). States: not-rated → early (<5 reports/90d) → still-good /
mixed / fading (recency-weighted rollup in `lib/ugc/store.ts`; thresholds documented
there). Capture: 1-tap verdict, stars, local toggle, tip, fairness price via
`POST /api/contribute` (anon-id auth, 1/venue/day + 6/hr rate limits, profanity
filter, report button; photos/tips moderated before display). Listing-quality hint
comes only from Overture confidence/completeness and is labelled "not a rating".
⚠️ Owner review before launch: licensing + moderation policy.
