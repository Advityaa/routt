import "server-only";
import { EXPERIENCES_PROVIDER, withTracking } from "./config";
import type { Experience, ExperienceAdapter, ExperienceProvider } from "./types";
import { MOCK_CITIES, mockAdapter } from "./adapters/mock";
import { headoutAdapter, viatorAdapter, getyourguideAdapter } from "./adapters/providers";

/**
 * Server-only experiences access. Resolves the configured provider adapter,
 * normalizes to our Experience type, and bakes affiliate tracking into the
 * booking URL before anything reaches the client. API keys never leave here.
 */

const ADAPTERS: Record<ExperienceProvider, ExperienceAdapter> = {
  mock: mockAdapter,
  headout: headoutAdapter,
  viator: viatorAdapter,
  getyourguide: getyourguideAdapter,
  klook: mockAdapter, // placeholder until a Klook adapter is added
};

function getAdapter(provider: ExperienceProvider): ExperienceAdapter {
  return ADAPTERS[provider] ?? mockAdapter;
}

export async function getExperiences(
  city: string,
  limit = 8
): Promise<Experience[]> {
  const adapter = getAdapter(EXPERIENCES_PROVIDER);
  let items: Experience[] = [];
  try {
    items = await adapter.list(city, { limit });
  } catch {
    items = [];
  }
  return items
    .slice(0, limit)
    .map((e) => ({ ...e, bookingUrl: withTracking(e.bookingUrl, { city: e.city }) }));
}

/** A small cross-city set for the optional homepage strip. */
export async function getCuratedExperiences(limit = 8): Promise<Experience[]> {
  const perCity = await Promise.all(
    MOCK_CITIES.map((c) => getExperiences(c, 2))
  );
  // round-robin one-per-city so the strip feels varied
  const out: Experience[] = [];
  for (let i = 0; i < 2; i++) {
    for (const list of perCity) if (list[i]) out.push(list[i]);
  }
  return out.slice(0, limit);
}
