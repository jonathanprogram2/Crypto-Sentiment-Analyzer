import { NextResponse } from "next/server";
import { scoreFromChange } from "@/lib/scoring";


export const dynamic = "force-dynamic";

const MAP: Record<string, { id: string; name: string }> = {
    btc: { id: "bitcoin", name: "Bitcoin" },
    eth: { id: "ethereum", name: "Ethereum" },
    sol: { id: "solana", name: "Solana" },
};

type DayRow = { date: string; price: number; sentiment: number };

export async function GET(
    _req: Request, 
    { params }: { params: { symbol: string } }
) {
    try {
        const symbol = (params.symbol || "").toLowerCase();
        const meta = MAP[symbol];
        if (!meta) { return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });
        }

        const cgHeaders = { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY ?? "", Accept: "application/json",};

        // 1) current + 24h change (for the unified score)
        const simpleUrl =
            `https://api.coingecko.com/api/v3/simple/price?ids=${meta.id}&vs_currencies=usd&include_24hr_change=true`;
            
        const simpleRes = await fetch(simpleUrl, { headers: cgHeaders, cache: "no-store" }
        );
        if (!simpleRes.ok) {
            const txt = await simpleRes.text();
            return NextResponse.json({ error: `CG simple fail: ${simpleRes.status} ${txt}` }, { status: 502 });
        }
        const simple = await simpleRes.json() as Record<string, { usd: number; usd_24h_change: number }>;
        const priceNow = Number(simple[meta.id]?.usd ?? 0);
        const deltaPct = Number(simple[meta.id]?.usd_24h_change ?? 0); // % over last 24h
        const deltaAbs = (priceNow * deltaPct) / 100;                  // $ change over last 24h
        const score = scoreFromChange(deltaPct);

        // 2) 7d market chart (for the line)
        const chartUrl = 
            `https://api.coingecko.com/api/v3/coins/${meta.id}/market_chart?vs_currency=usd&days=7&interval=hourly`;

        const chartRes = await fetch(chartUrl, { headers: cgHeaders, cache: "no-store"});

        let sevenDay: DayRow[] = [];
        if (!chartRes.ok) {
            const chart = (await chartRes.json()) as { prices: [number, number][] };
            if (Array.isArray(chart.prices) && chart.prices.length > 0) {
                sevenDay = chart.prices.map(([ts, price]) => ({
                    date: new Date(ts).toISOString(),
                    price,
                    sentiment: 0.5, // keep PoC value for now (optional to refine later)
                }));
            }
        }

        // --- #) Build 24h series + falback if chart was empty
        let twentyFour: DayRow[];
        if (sevenDay.length > 0) {
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            twentyFour = sevenDay.filter(r => new Date(r.date).getTime() >= cutoff);
            // if hourly data is sparse, ensure at least 2 points for a visible line
            if (twentyFour.length < 2 ) {
                const last = sevenDay.at(-1)!;
                twentyFour = [sevenDay.at(-2)!, last].filter(Boolean) as DayRow[];
            }
        } else {
            // Fallback: keep the page alive with a flat 7-day line around the latest price
            const now = Date.now();
            const startPrice = priceNow - deltaAbs;
            twentyFour = Array.from({ length: 25 }).map((_, i) => ({
                date: new Date(now - (24 - i) * 3600_000).toISOString(),
                price: startPrice + (deltaAbs * i) / 24,
                sentiment: 0.5,
            }));
            // And make a simple 7d line so the chart isnt empty
            const start7 = priceNow - deltaAbs * 7;
            sevenDay = Array.from({ length: 8 }, (_, i) => ({
                date: new Date(now - (7 - i) * 86_400_000).toISOString(),
                price: start7 + (deltaAbs * i),
                sentiment: 0.5
            }));
        }


        // PoC fields I already use
        const data = {
            symbol,
            name: meta.name,
            score,                   // <- unified with Discover
            confidence: "High",
            deltaPct,
            deltaAbs,
            twentyFour,
            sevenDay,
            scoreReasons: [
                "Score is derived from 24h price momentum mapped to 0-100.",
                "7d trend shown for visual context.",
            ],
            drivers: {
                positive: ["ETF inflows", "on-chain growth", "dev activity"],
                negative: ["regulatory headline", "exchange rumor"],
            },
            sourceMix: { reddit: 56, news: 38, other: 6 },
            evidence: [
                { source: "Reddit", title: "ETF inflows hit new weekly high", polarity: "Positive" },
                { source: "News", title: "Regulatory headline raises questions", polarity: "Negative" },
                { source: "RSS/Other", title: "On-chain activity trending up", polarity: "Positive" },
            ],
        };
        
        return NextResponse.json(data);
        } catch (e: any) {
          return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
    }
}



