import "./guard";
import type { RawReview, RawSourceDetails } from "../types";
import { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT, hasReddit } from "./env";

/**
 * Reddit as a LIGHT corroboration signal — NOT a rating/discovery source.
 *
 * Reddit can't do geo "nearby" search, so it doesn't seed places. Instead, after
 * Google/Foursquare resolve a place, we search local subreddits (r/bangkok,
 * r/thailand) for the place NAME: how often locals mention it, and a crude
 * sentiment from snippets. This becomes a low-weight cross-source vote (locals'
 * take, on a 0–1 sentiment scale) plus a few snippet "reviews". It is explicitly
 * NOT full review scoring. Requires Reddit OAuth app creds; degrades to
 * "0 mentions, unconfigured" otherwise. (Reddit blocks unauthenticated JSON.)
 */

const SUBS = "bangkok+thailand";
const POS = /\b(great|amazing|best|love|delicious|worth|authentic|legit|solid|favou?rite|underrated)\b/gi;
const NEG = /\b(overrated|tourist trap|avoid|scam|overpriced|meh|disappointing|skip|not worth|dead|gone downhill)\b/gi;

export interface RedditCorroboration {
  configured: boolean;
  count: number; // number of matching posts/mentions
  sentiment: number; // 0–1, crude
  snippets: { text: string; dateISO: string }[];
}

let tokenCache: { token: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!hasReddit()) return null;
  if (tokenCache && tokenCache.expires > Date.now()) return tokenCache.token;
  try {
    const basic = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString("base64");
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": REDDIT_USER_AGENT,
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    tokenCache = { token: json.access_token, expires: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000 };
    return tokenCache.token;
  } catch {
    return null;
  }
}

function crudeSentiment(texts: string[]): number {
  const blob = texts.join(" ");
  const pos = (blob.match(POS) ?? []).length;
  const neg = (blob.match(NEG) ?? []).length;
  if (pos + neg === 0) return 0.5; // mentioned but no clear valence
  return pos / (pos + neg);
}

/** Search local subreddits for a place name; return mentions + snippets + sentiment. */
export async function corroborateOnReddit(placeName: string): Promise<RedditCorroboration> {
  const token = await getToken();
  if (!token) return { configured: false, count: 0, sentiment: 0.5, snippets: [] };

  try {
    const q = encodeURIComponent(`"${placeName}"`);
    const url = `https://oauth.reddit.com/r/${SUBS}/search?q=${q}&restrict_sr=1&limit=15&sort=relevance&type=link`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": REDDIT_USER_AGENT },
    });
    if (!res.ok) return { configured: true, count: 0, sentiment: 0.5, snippets: [] };

    const json = (await res.json()) as {
      data?: { children?: { data?: { title?: string; selftext?: string; created_utc?: number } }[] };
    };
    const posts = (json.data?.children ?? []).map((c) => c.data ?? {});
    const texts = posts.map((p) => `${p.title ?? ""} ${p.selftext ?? ""}`.trim()).filter(Boolean);

    return {
      configured: true,
      count: posts.length, // "no mentions" → 0, handled by callers
      sentiment: crudeSentiment(texts),
      snippets: posts.slice(0, 5).map((p) => ({
        text: (p.title ?? "").slice(0, 200),
        dateISO: new Date((p.created_utc ?? 0) * 1000).toISOString().slice(0, 10),
      })),
    };
  } catch {
    return { configured: true, count: 0, sentiment: 0.5, snippets: [] };
  }
}

/**
 * Turn Reddit corroboration into a low-weight cross-source record: sentiment as a
 * 0–1 rating, snippets as light "reviews" (classified local-leaning by the
 * heuristic, since Reddit skews local). Only meaningful when there ARE mentions.
 */
export function redditAsDetails(
  corr: RedditCorroboration,
  placeName: string,
): RawSourceDetails | null {
  if (corr.count <= 0) return null;
  const reviews: RawReview[] = corr.snippets.map((s) => ({
    text: s.text,
    rating: corr.sentiment,
    dateISO: s.dateISO,
    language: "en",
    // no explicit label → classifier infers (Reddit text usually reads local)
  }));
  return {
    sourceName: "reddit",
    sourceId: `reddit:${placeName}`,
    name: placeName,
    rating: corr.sentiment,
    ratingScaleMax: 1,
    ratingNormalized: corr.sentiment * 5,
    reviewCount: corr.count,
    reviews,
    photos: [],
  };
}
