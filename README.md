# Crypto Sentiment Analyzer

A polished MVP built with **Next.js (App Router) + TypeScript** that pulls fresh crypto headlines, runs lightweight **headline sentiment**, blends it with **price momentum**, and presents a clean, explorable UI:

- **Token Detail** (scores, 24h/7d momentum, source mix, evidence feed)
- **Explore** (single-column news hub with OG previews)
- **Compare** (side-by-side score/price/evidence) + **Who’s Hot?** heatmap
- **“How it works”** modal (human-readable overview)

> Demo-focused, read-only tool. No accounts. No tracking.  

---
## 🚀 Live Demo (Vercel)

The app is deployed on Vercel:

### URL
https://cryptosenanalyzer.vercel.app/

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [Tech stack](#tech-stack)
- [Key routes & API](#key-routes--api)
- [Scoring model (high level)](#scoring-model-high-level)
- [Project structure](#project-structure)
- [Roadmap / nice-to-haves](#roadmap--nice-to-haves)
- [License](#license)

---
## Supported Tokens (MVP)

- **BTC**, **ETH**, **SOL**
---

## Features

### Product
- ✅ **Discover → Token Detail**  
  Per-token score, 24h/7d trend, source mix, drivers, and an evidence feed with sentiment chips.
- ✅ **Explore hub** (`/explore?symbol=btc`)  
  Curated stream from the last ~7 days with **OG thumbnail/description** enrichments where available.
- ✅ **Compare modal** (global in the navbar)  
  Side-by-side **score, price, Δ**, and **latest evidence** for two tokens.  
  Bonus: **Who’s Hot?** 🔥 quick heatmap ranking by recent momentum.
- ✅ **“How it works”**  
  Friendly, centered modal that explains sources, scoring, compare, and heatmap in plain language.

### Data
- ✅ **Real feeds** (best-effort public sources):  
  **Reddit** (search, last week), **Google News RSS** (7d), **Hacker News (Algolia)**.  
  Optional: **CoinDesk/CoinTelegraph RSS** for richer headlines.
- ✅ **OpenGraph enrichment**  
  Fetches OG image/description for the top N Explore items to improve scannability.
- ✅ **Price / momentum**  
  Uses CoinGecko endpoints (with graceful fallback) to display price and compute Δ.

### Engineering
- ✅ **Next.js App Router** with server components + client islands  
- ✅ **TypeScript** end-to-end  
- ✅ **API routes** for token data, explore enrichment, and health checks  
- ✅ **Tailwind** + small utility components for a cohesive dark UI  
- ✅ **Build diagnostics**: `/api/health` returns base URL & simple sanity signals

---

## Screenshots

**Home Page**  
<img width="2545" height="1394" alt="Screenshot 2026-01-06 194201" src="https://github.com/user-attachments/assets/abf669ff-8898-48db-aaf9-8bc390f10570" />

**Token Detail Page**  
<img width="2545" height="1397" alt="Screenshot 2026-01-06 195107" src="https://github.com/user-attachments/assets/7ab345e1-7ff1-413e-bd17-b741f5098145" />

**Explore Page**  
<img width="2533" height="1391" alt="Screenshot 2026-01-06 195144" src="https://github.com/user-attachments/assets/a90b3037-45d6-4478-8fc0-425f6f18671e" />

**Compare modal**
<img width="2498" height="1280" alt="Screenshot 2026-01-06 194935" src="https://github.com/user-attachments/assets/70e52af1-ee5f-47ba-a8cb-a86deed2d8e9" />

**“Who’s Hot?” heatmap**  
<img width="2431" height="1278" alt="Screenshot 2026-01-06 195015" src="https://github.com/user-attachments/assets/cbb15f1b-b587-4b7b-b47d-a7f1706a719c" />


---

## Quick start

```bash
# 1) install
npm install

# 2) dev server
npm run dev
# -> http://localhost:3000
```
---
## Tech stack
 - Next.js 15 (App Router) + TypeScript
 - React Server Components + client islands
 - Tailwind CSS
 - Plotly treemap (heatmap widget) + lightweight SVG/DOM for the rest
 - Cheerio for OG extraction on Explore enrich
 - fetch with timeouts and defensive fallbacks
 - Deployed on Vercel
---
## Key routes & API
### App pages
 - GET / — Discover (entry)
 - GET /token/[symbol] — Token detail (BTC/ETH/SOL supported OOTB)
 - GET /explore?symbol=btc — Explore news hub
 - **Compare** — modal available from the navbar on any page

### API routes (internal)
 - GET /api/token/[symbol] — Core data for Token Detail & Compare
Returns: pricing, score, Δ, source mix, 24h/7d arrays, and latest evidence.
 - GET /api/health — Simple runtime diagnostics (used to verify Vercel settings)
 - GET /api/enrich — Fetch OG meta for Explore items (called server-side)

---
## API response shape (simplified)
```
type Polarity = "Positive" | "Neutral" | "Negative";
type DayRow   = { date: string; price: number; sentiment: number };
type Evidence = { source: "Reddit" | "News" | "Other"; title: string; url?: string; polarity: Polarity; };

type TokenData = {
  symbol: string;
  name: string;
  priceUsd: number;
  deltaPct: number;  // 24h Δ%
  deltaAbs: number;  // absolute change
  score: number;     // 0-100 unified score from Δ%
  confidence: "High" | "Low";
  twentyFour: DayRow[];
  sevenDay: DayRow[];
  sourceMix: { reddit: number; news: number; other: number }; // %
  evidence: Evidence[]; // latest mixed feed
  debug?: Record<string, unknown>;
};
```
---
## Scoring model (high level)
 - **Headline Mood**: rule-based on titles only → Positive / Neutral / Negative (shown per evidence item).
 - **Unified Score (0–100)**: maps **24h price change** to a comparable score so tokens are easy to stack-rank.
 - **Heatmap**: shows per-token **counts** of positive/neutral/negative evidence in the last 7 days.
 - The value is **directional** and **demo-oriented** — not financial advice.
---
## Project structure
```
src/
  app/
    api/
      discover/route.ts
      enrich/route.ts           # OG enrichment helper
      health/route.ts           # diagnostics
      token/[symbol]/route.ts   # token data aggregation (price + headlines)
    explore/page.tsx            # Explore hub (server component + enrich calls)
    token/[symbol]/page.tsx     # Token detail
    layout.tsx                  # global shell and navbar
    globals.css                 # Tailwind & theme
    page.tsx
  components/
    NavBar.tsx                  # global nav + Compare modal + HowItWorks
    TokenDetailClient.tsx       # interactive parts on token detail
    HeadlineCard.tsx            # explore news tiles
    HeatmapTreemapPlotly.tsx    # "Who's Hot?" widget
    HowItWorks.tsx              # centered help modal
    ScoreLegend.tsx
    ExploreClient.tsx
    TrendLine.tsx
  hooks/
    useTokenDetail.ts           # client fetch helper for compare/details
  lib/
    og.ts                       # cheerio-based OG extractor
    scoring.ts                  # Δ% -> score mapping
    tokens.ts                   # supported token metadata
```
---
## Roadmap / nice-to-haves
 - More tokens + user-editable watchlist
 - Smarter sentiment (body text, entity awareness)
 - Source filters & alerts
 - Persisted preferences (local storage)
 - Pagination & infinite scroll on Explore
 - Better rate-limit handling & caching layer (KV/Edge)
---
## Troubleshooting

- **Explore shows no items**  
  The feed only shows recent items (last ~7 days). Try BTC first; BTC has the richest feed.
  Also ensure your local base URL is reachable by server components (`NEXT_PUBLIC_BASE_URL=http://localhost:3000`).

- **Rate limits from APIs**  
  Public endpoints (Reddit/Google News/HN) may throttle. The app degrades gracefully; try again after a minute.

- **OG thumbnails missing**  
  Some sites block scraping or omit OG tags. The article still appears without an image.

- **Prices/trend fallback**  
  If CoinGecko is unavailable, the app renders a minimal synthetic trend so UI isn’t empty.

---
## Attribution & Fair Use

Headlines/snippets are sourced from public endpoints (Reddit, Google News RSS, HN/Algolia).
Thumbnails/descriptions are derived from OpenGraph metadata when available. This project is
an educational MVP and does not store or republish full articles.

---

### License
MIT

---
