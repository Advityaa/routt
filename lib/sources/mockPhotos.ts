import type { RawPhoto } from "./types";

/**
 * Mock photo assets: real, CC-licensed photos of (or representative of) the
 * actual Bangkok places, fetched from Wikimedia Commons into /public/mock-photos.
 * Attribution is REQUIRED by the licenses and is displayed on the detail screen.
 * Full license record: public/mock-photos/attribution.json.
 *
 * Only some places have photos — deliberately. Missing photos exercise the
 * palette placeholder (unrated/low-data places often have none in real life).
 */
const MOCK_PHOTOS: Record<string, string> = {
  "eat-jok-prince": "hkgalbert · CC BY-SA 3.0 · Wikimedia Commons",
  "eat-thip-grand-padthai": "Krista · CC BY 2.0 · Wikimedia Commons",
  "shop-or-tor-kor": "Wittylama · CC BY-SA 4.0 · Wikimedia Commons",
  "see-loha-prasat": "Rangan Datta Wiki · CC BY-SA 4.0 · Wikimedia Commons",
  "see-benjakitti-park": "Supanut Arunoprayote · CC BY 4.0 · Wikimedia Commons",
  "see-golden-viewpoint": "Vyacheslav Argenberg · CC BY 4.0 · Wikimedia Commons",
};

export function mockPhotosFor(placeId: string): RawPhoto[] {
  const attribution = MOCK_PHOTOS[placeId];
  if (!attribution) return [];
  return [{ url: `/mock-photos/${placeId}.jpg`, attribution }];
}
