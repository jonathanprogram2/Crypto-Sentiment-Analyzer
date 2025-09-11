# Crypto Sentiment Analyzer

> A Next.js proof-of-concept that aggregates crypto sentiment signals (news, Reddit, RSS/other) and surfaces a per-token score, drivers, and an evidence feed.

---
# Screenshots

- Token Detail – **24h**
<img width="2526" height="1395" alt="Screenshot 2025-09-11 132946" src="https://github.com/user-attachments/assets/fb4e5b6f-c0f4-4f35-a03f-145ebcf89ef5" />

- Token Detail – **7d**
<img width="2532" height="1405" alt="image" src="https://github.com/user-attachments/assets/f20a831e-4c90-4af6-a3d4-0969c6b8ba7d" />

- “Why this score?” modal
<img width="1050" height="758" alt="Screenshot 2025-09-11 135422" src="https://github.com/user-attachments/assets/95c85ad0-7295-455f-92d6-b812748a2d71" />

---

## What’s included 

- ✅ **Token Detail** page (`/token/[symbol]`) using **SWR**
- ✅ **Mock API** route: `/api/token/[symbol]` (serves `public/sample-btc.json`)
- ✅ **24h/7d toggle** (+ pointer cursor)
- ✅ **Score** badge + **Δ (window)** ▲/▼ overlay
- ✅ **Drivers & Source mix**
- ✅ **Evidence Feed** with polarity chips (Positive/Negative/Neutral)
- ✅ **“Why this score?”** modal (a11y: `aria-modal`, overlay click to close)
- ✅ **Navy theme** via Tailwind (cards: `bg-white/10 ring-white/20`)
- ✅ **Chart.js** line chart with:
  - 24h: **12-hour time** on X axis (e.g., `4:00 PM`)
  - 7d: **MMM d** on X axis (e.g., `Sep 7`)


---

## Quick start

~~~bash
# 1) install
npm install

# 2) dev
npm run dev
# app: http://localhost:3000 

~~~

Node 18+ recommended.

---

## Tech stack

- **Next.js (App Router) + TypeScript**
- **SWR** for data fetching
- **API Routes** (`/api/token/[symbol]`)
- **Chart.js (react-chartjs-2)** for the trend line
- **Tailwind CSS** for styling

---

---

## Project structure (key bits)

~~~text
src/
  app/
    api/
      token/
        [symbol]/
          route.ts          # returns mock JSON for now
    token/
      [symbol]/
        page.tsx            # loads TokenDetailClient with params.symbol
    layout.tsx              # body bg + globals import
    globals.css             # @tailwind base; components; utilities
  components/
    TokenDetailClient.tsx   # page UI shell
    TrendLine.tsx           # chart.js line chart
  hooks/
    useTokenDetail.ts       # SWR hook (fetches /api/token/[symbol])

public/
  sample-btc.json           # mock response used by /api/token/btc
~~~

---

## API shape

The Token Detail UI expects this shape (served by `/api/token/:symbol`):

~~~ts
type DayRow   = { date: string; price: number; sentiment: number };
type Evidence = { source: string; title: string; polarity: "Positive"|"Negative"|"Neutral"; url?: string };

type TokenData = {
  symbol: string; name: string; score: number; confidence: string;
  scoreReasons: string[];
  twentyFour: DayRow[];
  sevenDay: DayRow[];
  drivers: { positive: string[]; negative: string[] };
  sourceMix: { reddit: number; news: number; other: number };
  evidence: Evidence[];
};
~~~

---

## How it works (at a glance)

- `useTokenDetail(symbol, windowSel)` uses **SWR** to hit `/api/token/:symbol`.
- `TrendLine` receives `rows` and formats the X-axis:
  - `24h` → 12-hour times (AM/PM)
  - `7d` → abbreviated date (`Sep 7`)
- “Why this score?” pulls from `scoreReasons[]` and opens a modal (`aria-modal="true"`).

---

## Styling / Theme

- Global navy background is set on `<body>` in `src/app/layout.tsx`:

~~~tsx
<body className="min-h-screen bg-[#0b1220] text-slate-100">
~~~

- Card contrast: `bg-white/10 ring-white/20`
- Pointer cursors added to 24h/7d toggle and “Why this score?”

---


## License

MIT

---
