# Routt

First-trip playbooks for first-time Indian international travellers. Honest,
India-specific advice (eSIM, zero-markup forex, the local cab app, where to eat,
how not to overpay) that earns affiliate commission when readers act on it.

**Phase 1 goal:** test one hypothesis — do first-timers trust us enough to click
through and act on our recommendations? The metric that matters is affiliate
click-through rate per playbook.

## Stack

- **Next.js** (App Router) — pages pre-rendered as static (SSG) for speed + SEO
- **TypeScript** + **Tailwind CSS**
- **MDX** for content — one `.mdx` file per destination, no database
- **Vercel Analytics** — tracks the outbound affiliate clicks
- Deploys to **Vercel**

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (validates all MDX + SSG)
```

## How it's wired

```
app/
  layout.tsx              nav + footer + fonts + analytics
  page.tsx                landing: hero + interactive checklist, grid, why, how, email
  [destination]/page.tsx  renders a playbook from MDX (SSG, one route per file)
content/destinations/     one .mdx playbook per destination
components/               Nav, Footer, DestinationCard, Checklist, HeroChecklist,
                          AffiliateButton, EmailCapture, mdx (MDX styling map)
lib/
  affiliate.ts            central map of affiliate links + tracked-click event
  content.ts              reads/parses the MDX playbooks
```

## Adding a destination

Drop a new file in `content/destinations/<slug>.mdx`. It renders automatically at
`/<slug>` and appears on the landing grid. Frontmatter required:

```yaml
---
title: Dubai
country: United Arab Emirates
flag: 🇦🇪
order: 1                # position on the landing grid
tagline: One-line hook for the card.
summary: 2–3 sentence intro shown on the playbook header.
checklist:              # shown live in the landing hero when selected
  - Install an eSIM before you fly
  - Get a zero-markup forex card
---
```

Body uses standard Markdown plus two components:

- `<AffiliateButton partner="airalo" />` — the **only** way to link out. Fires a
  tracked `affiliate_click` event (partner, category, destination) then opens the
  partner in a new tab. The `destination` slug is injected automatically.
- `<Checklist items={[...]} />` — optional inline checklist.

> ⚠️ If a frontmatter `summary` contains a colon (`:`), wrap the whole value in
> double quotes or YAML parsing fails.

## Affiliate links

All partners live in [lib/affiliate.ts](lib/affiliate.ts), keyed by a stable id.
The URLs there are plain brand links — paste the real affiliate/deep links in
when they're ready; the ids stay stable so historical click data keeps lining up.

Phase 1 categories only: **eSIM**, **forex card**, **travel insurance**,
**activities**.

## Tracking

Two custom Vercel Analytics events:

- `affiliate_click` — `{ partner, category, destination }`, the core funnel metric
- `email_signup` — fired by the landing email capture (no list wired yet; Phase 1
  just measures intent)

Click-through rate = playbook views (page views) → `affiliate_click` events.

## Deploy

Push to a Git repo and import on Vercel (free tier), or `npx vercel`. Enable Web
Analytics in the Vercel dashboard so the events above show up. No env vars needed.

## Explicitly NOT in Phase 1

No database, accounts, CMS, ML/recommendations, reviews/photos, or booking/checkout.
We link out, we don't transact. Capped at 6–8 destinations to start.
