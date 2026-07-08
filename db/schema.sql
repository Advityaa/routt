-- Routt venue store — Postgres + PostGIS target schema.
-- v1 serves from data/venues/*.json + data/signals/*.json (same shapes); this is
-- the documented migration path. Loader: scripts/load-city.mjs reads the extract
-- JSON and upserts here by gers_id once DATABASE_URL is configured.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Licensed venue skeleton (Overture CDLA-P-2.0; OSM rows carry source='osm').
-- KEPT SEPARATE from first-party UGC (venue_signals) so our proprietary signals
-- never entangle with source-data licensing. See README "Licensing".
CREATE TABLE IF NOT EXISTS venues (
  gers_id        text PRIMARY KEY,          -- Overture GERS id (stable across releases)
  name           text NOT NULL,
  basic_category text,
  taxonomy       jsonb,
  lat            double precision NOT NULL,
  lng            double precision NOT NULL,
  geog           geography(Point, 4326) GENERATED ALWAYS AS
                   (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
  address        text,
  locality       text,
  website        text,
  phone          text,
  confidence     real,
  source         text NOT NULL DEFAULT 'overture' CHECK (source IN ('overture', 'osm')),
  city           text NOT NULL,
  last_synced    timestamptz NOT NULL DEFAULT now()
);

-- Fast proximity ("venues near lat/lng") + per-city queries.
CREATE INDEX IF NOT EXISTS venues_geog_gist ON venues USING GIST (geog);
CREATE INDEX IF NOT EXISTS venues_city_idx ON venues (city);

-- FIRST-PARTY UGC — our proprietary signals, keyed to the venue skeleton by
-- GERS id but stored apart. Refreshing Overture upserts venues only; this table
-- survives untouched.
CREATE TABLE IF NOT EXISTS venue_signals (
  id                  bigserial PRIMARY KEY,
  gers_id             text NOT NULL REFERENCES venues (gers_id) ON DELETE CASCADE,
  rating              real,
  review_count        integer NOT NULL DEFAULT 0,
  still_open_votes    integer NOT NULL DEFAULT 0,
  tips                jsonb NOT NULL DEFAULT '[]',
  fairness_price_low  numeric,
  fairness_price_high numeric,
  -- TRUE until real users generate these — never present seed data as verified.
  is_seed_demo        boolean NOT NULL DEFAULT true,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gers_id)
);

-- ── First-party UGC capture (real traveler signal — the moat) ────────────────
-- Raw contributions. NEVER seeded, NEVER external review data (Google/FSQ terms
-- forbid storing theirs — and it would dilute the owned-data moat).
CREATE TABLE IF NOT EXISTS venue_reviews (
  id          bigserial PRIMARY KEY,
  gers_id     text NOT NULL,                 -- Overture GERS key (venue skeleton)
  user_id     text NOT NULL,                 -- anon id or account id (lightweight auth)
  handle      text,                          -- display: first name / handle only
  quick       text CHECK (quick IN ('still-good','not-what-it-was','closed')),
  rating      smallint CHECK (rating BETWEEN 1 AND 5),
  text        text,
  is_local    boolean NOT NULL DEFAULT false,
  price_paid  numeric,                       -- fairness price input (local currency)
  photo_url   text,                          -- our own storage only
  moderated   boolean NOT NULL DEFAULT false, -- photos/tips hidden until true
  reported    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_reviews_gers_idx ON venue_reviews (gers_id, created_at DESC);

-- Rolled-up signals (recomputed from venue_reviews, recency-weighted).
-- Replaces the seed-era shape; verdict_state asserts ONLY above thresholds.
ALTER TABLE venue_signals
  ADD COLUMN IF NOT EXISTS verdict_state text
    CHECK (verdict_state IN ('not-rated','early','still-good','mixed','fading')),
  ADD COLUMN IF NOT EXISTS review_count_90d integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS local_pct real,
  ADD COLUMN IF NOT EXISTS avg_rating real,
  ADD COLUMN IF NOT EXISTS last_computed timestamptz;
