# Routt — Approved Free Data Sources (canonical registry)

The ONLY external data sources Routt integrates. Anything not listed here is
off-limits (notably: Google Places, Foursquare, and Reddit adapters are
retired — see "Status vs codebase" below). Licensing flags are load-bearing.

## Foundation layer (venues/POI)
| Source | Use | Key facts | Status in codebase |
|---|---|---|---|
| Overture Maps | Venue skeleton, GERS ids | Bulk GeoParquet, CDLA-P-2.0 | ✅ Built — `scripts/extract-city.mjs`, `/api/venues` (126k BKK venues) |
| OSM / Nominatim | Gap-fill + live geocoding | 1 req/sec hard cap, valid UA, ODbL attribution, no bulk; self-host if scaling | ✅ Built — `lib/venues/nominatim.ts` (queue+cache+UA) |

## City & reference
| Source | Use | Key facts | Status |
|---|---|---|---|
| GeoNames | Population, timezone, elevation, admin | free username, 10k/day, 1k/hr, CC-BY | ⬜ not built |
| Wikidata | Structured facts (SPARQL) | query.wikidata.org/sparql — no key, no limit | ⬜ not built |
| Wikipedia REST | City/place descriptions | page/summary — no key, CC BY-SA (**paraphrase, don't reproduce**) | ⬜ not built |

## Weather
| Open-Meteo | Forecast, historical, air quality | no key, 10k/day — ⚠️ **non-commercial license; confirm terms before shipping on monetized screens** | ✅ Built — `/api/weather`, `/api/tripweather` · ⚠️ arrival/trip screens carry affiliate links → resolve before launch |

## Currency
| Frankfurter | FX display | api.frankfurter.dev — no key, no quota, **commercial OK** | ⬜ not built — replaces the fixed THB rate in `lib/insights.ts` |

## Public holidays
| Nager.Date | Holiday calendars | no key — ⚠️ verify hosted-API ToS for commercial use | ⬜ not built |

## Safety & advisories
| US State Dept · UK gov.uk Content API · GDACS | Advisories + hazard alerts | all free, no key | ⬜ not built |

## Cost of living
| World Bank / ILO / Eurostat | DIY index (no free Numbeo equivalent) | open data | ⬜ not built — haggle ranges (`lib/haggle.ts`) are hand-maintained until this exists |

## Restaurants / food
| OSM/Overture tags | cuisine, diet:* (veg/vegan/halal/kosher), price | already in foundation layer | 🔶 partial — extract doesn't pull cuisine/diet tags yet |

## Attractions
| Wikidata+Wikipedia (primary) · OpenTripMap (⚠️ ODbL share-alike) · Smithsonian (CC0) · Europeana · NPS · UNESCO list | POI enrichment | free keys where noted | ⬜ not built |

## Events
| Source | Coverage | Status |
|---|---|---|
| Ticketmaster Discovery (primary) | US/UK/CA/MX/select EU — 5k/day, 5 req/s | ⬜ not built |
| SeatGeek (secondary) | US/CA | ⬜ not built |
| Skiddle | UK only | ⬜ not built |
| Bandsintown | per-artist only — NOT city discovery | ⬜ not built |
| **Everywhere else incl. India/Thailand** | **no legitimate free API — editorial/curated calendar** | 🔶 current mock events = the curated-calendar path for Bangkok |

## Transit
| Transitland / Mobility Database | GTFS feeds, global | ⬜ not built — `GettingThereBack` is rule-based until wired |

## Retired (do not use)
- Google Places / Foursquare / Reddit adapters (`lib/sources/server/*`) and the
  `/api/photo` Google proxy — kept in-tree as dormant reference behind USE_MOCK,
  never to be keyed/enabled. The cross-check trust story now rests on
  Overture + OSM + Wikidata + **first-party UGC** (`venue_reviews`).
- Unsplash placeholder photography is a prototype-phase asset pipeline
  (`lib/placeholderImages.ts`), not a data source; unchanged.
