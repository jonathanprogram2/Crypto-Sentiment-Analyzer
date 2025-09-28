import { NextRequest, NextResponse } from "next/server";
import { scoreFromChange } from "@/lib/scoring";
import Sentiment from "sentiment";


export const runtime = "nodejs"
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Polarity = "Positive" | "Negative" | "Neutral";
type Evidence = { source: "Reddit" | "News" | "Other"; title: string; url?: string; polarity: Polarity };
type DayRow = { date: string; price: number; sentiment: number };

const MAP: Record<string, { id: string; name: string }> = {
    btc: { id: "bitcoin", name: "Bitcoin" },
    eth: { id: "ethereum", name: "Ethereum" },
    sol: { id: "solana", name: "Solana" },
};

const sentiment = new Sentiment();
const toPolarity = (s: number): Polarity => (s > 1 ? "Positive" : s < -1 ? "Negative" : "Neutral");

async function fetchJsonWithFallback(url: string, headers?: Record<string, string>) {
    let res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) {
        res = await fetch(url, { cache: "no-store" });
    }
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false as const, status: res.status, text };
    }
    const json = await res.json().catch(() => null);
    return { ok: true as const, json };
}


const withTimeout = <T,>(p: Promise<T>, ms = 4500) =>
    Promise.race<T>([
        p,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)) as any,
    ]);


/** -------------------Real sources( no more fake news ) --------------------------------------------*/
async function fetchRedditEvidence(q: string): Promise<Evidence[]> {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&limit=10&t=week&sort=hot`;
    const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": "crypto-sentiment-analyzer/1.0 (+https://example.com)" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = (json?.data?.children ?? [])
        .map((c: any) => c.data)
        .filter((d: any) => d?.title && !d.stickied && !d.locked);

    return items.slice(0, 8).map((d: any) => {
        const score = sentiment.analyze(d.title).score;
        return {
            source: "Reddit",
            title: d.title,
            url: `https://www.reddit.com${d.permalink}`,
            polarity: toPolarity(score),
        };
    });
}

async function fetchGoogleNewsEvidence(q: string): Promise<Evidence[]> {
    // 7-day window on Google News RSS
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:7d&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const xml = await res.text();

    const matches = Array.from(
        xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>/g),
    ).slice(0, 4);

    return matches.map((m) => {
        const title = m[1];
        const link = m[2];
        const score = sentiment.analyze(title).score;
        return { source: "News", title, url: link, polarity: toPolarity(score) };
    });
}

async function fetchOtherEvidence(q: string): Promise<Evidence[]> {
    // Hacker News (Algolia) as "Other" signal, filter to decent stories
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(
    q,
  )}&tags=story&numericFilters=points>10`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  const hits = (json?.hits ?? []).filter((h: any) => h?.title || h?.story_title);

  return hits.slice(0, 4).map((h: any) => {
    const title = h.title || h.story_title || "";
    const score = sentiment.analyze(title).score;
    return { source: "Other", title, url: h.url || h.story_url, polarity: toPolarity(score) };
  });
}

/** ------------------------------------------------------------------------------------------------------------------ */

export async function GET(
    _req: NextRequest, 
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
       
        const { symbol } = await params;
        console.log("TOKEN API hit", { symbol, when: new Date().toISOString(), vercelUrl: process.env.VERCEL_URL });
        const meta = MAP[symbol];
        if (!meta) { return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });
        }

        const cgHeaders = { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY ?? "", Accept: "application/json",};

        const simpleUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${meta.id}&vs_currencies=usd&include_24hr_change=true`;
        const simple = await fetchJsonWithFallback(simpleUrl, cgHeaders);
        
        let priceNow = 0;
        let deltaPct = 0;
        if (simple.ok && simple.json && simple.json[meta.id]) {
            priceNow = Number(simple.json[meta.id].usd ?? 0);
            deltaPct = Number(simple.json[meta.id].usd_24h_change ?? 0);
        }
        const deltaAbs = (priceNow * deltaPct) / 100;
        const score = scoreFromChange(deltaPct);


        // 2) 7d market chart (for the line)
        const chartUrl = new URL(`https://api.coingecko.com/api/v3/coins/${meta.id}/market_chart`);
        chartUrl.searchParams.set("vs_currency", "usd");
        chartUrl.searchParams.set("days", "7");
        chartUrl.searchParams.set("precision", "2");

        let chartRes = await fetch(chartUrl.toString(), { headers: cgHeaders, cache: "no-store" });
        if (!chartRes.ok) chartRes = await fetch(chartUrl.toString(), { cache: "no-store"});

        let sevenDay: DayRow[] = [];
        let usedFallback = false;

        if (chartRes.ok) {
            let chart: { prices?: [number, number][] } = {};
            try {
                chart = (await chartRes.json()) as any;
            } catch {

            }
            if (Array.isArray(chart.prices) && chart.prices.length > 0) {
                const pts = chart.prices
                    .map(([ts, p]) => ({ ts: Number(ts), price: Number(p) }))
                    .filter((d) => Number.isFinite(d.ts) && Number.isFinite(d.price))
                    .sort((a, b) => a.ts - b.ts);

                const dedup: { ts: number; price: number }[] = [];
                for (const d of pts) if (!dedup.length || dedup[dedup.length - 1].ts !== d.ts) dedup.push(d);

                sevenDay = dedup.map((d) => ({
                    date: new Date(d.ts).toISOString(),
                    price: d.price,
                    sentiment: 0.5,
                }));
            } else {
                usedFallback = true;
            }
        } else {
            // Fallback: keep the page alive with a flat 7-day line around the latest price
            usedFallback = true;
        }

        let twentyFour: DayRow[] = [];
        if (sevenDay.length > 0) {
            // last ~26 points as a 24h slice
            const lastN = 26;
            twentyFour = sevenDay.slice(Math.max(0, sevenDay.length - lastN));
        } else {
            // synthetic line so UI isn't empty
            const now = Date.now();
            const startPrice = priceNow - (priceNow * deltaPct) / 100;
            twentyFour = Array.from({ length: 25 }, (_, i) => ({
                date: new Date(now - (24 - i) * 3600_000).toISOString(),
                price: startPrice + ((priceNow - startPrice) * i) / 24,
                sentiment: 0.5,
            }));
            // And make a simple 7d line so the chart isnt empty
            const start7 = priceNow - ((priceNow * deltaPct) / 100) * 7;
            sevenDay = Array.from({ length: 8 }, (_, i) => ({
                date: new Date(now - (7 - i) * 86_400_000).toISOString(),
                price: start7 + (((priceNow - start7) / 7) * i),
                sentiment: 0.5
            }));
        }

        // 4) Evidence ------------------------------------------
        const query = meta.name; // "Bitcoin", "Ethereum", "Solana"
        const [r1, r2, r3] = await Promise.allSettled([
            withTimeout(fetchRedditEvidence(query), 4500),
            withTimeout(fetchGoogleNewsEvidence(query), 4500),
            withTimeout(fetchOtherEvidence(query), 4500),
        ]);

        const evidence: Evidence[] = [
            ...(r1.status === "fulfilled" ? r1.value : []),
            ...(r2.status === "fulfilled" ? r2.value : []),
            ...(r3.status === "fulfilled" ? r3.value : []),
        ].slice(0, 12);

        console.log("Evidence results", {
            r1: r1.status === "fulfilled" ? (r1.value as Evidence[]).length : `err:${String((r1 as any).reason)}`,
            r2: r2.status === "fulfilled" ? (r2.value as Evidence[]).length : `err:${String((r2 as any).reason)}`,
            r3: r3.status === "fulfilled" ? (r3.value as Evidence[]).length : `err:${String((r3 as any).reason)}`,
            total: evidence.length,
        });

        const counts = { reddit: 0, news: 0, other: 0 };
        for (const e of evidence) {
            if (e.source === "Reddit") counts.reddit++;
            else if (e.source === "News") counts.news++;
            else counts.other++;
        }
        const total = Math.max(1, evidence.length);
        const sourceMix = {
            reddit: Math.round((counts.reddit / total) * 100),
            news: Math.round((counts.news / total) * 100),
            other: Math.round((counts.other / total) * 100),
        };


        // 5) Response
        return NextResponse.json({
            symbol, 
            name: meta.name,
            priceUsd: priceNow, 
            score, 
            confidence: simple.ok ? "High" : "Low",
            deltaPct, 
            deltaAbs,
            twentyFour, 
            sevenDay,
            sourceMix, 
            evidence,
            debug: { 
                cgSimpleOk: simple.ok,
                sevenDayPoints: sevenDay.length,
                twentyFourPoints: twentyFour.length,
                usedFallback,
            },
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: String(e?.message ?? e) },
            { status: 200 }
        );
    }
}