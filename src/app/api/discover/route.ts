import { NextResponse } from "next/server";
import { scoreFromChange } from "@/lib/scoring";

export const dynamic = "force-dynamic";


const MAP: Record<string, { id: string; name: string }> = {
    btc: { id: "bitcoin", name: "Bitcoin" },
    eth: { id: "ethereum", name: "Ethereum" },
    sol: { id: "solana", name: "Solana" },
};

export async function GET() {
    try {
        const ids = Object.values(MAP).map(m => m.id).join(",");
        const cgHeaders = { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY ?? "" };

        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
            { headers: cgHeaders, cache: "no-store" }
        );
        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: `CG fail: ${res.status} ${txt}` }, { status: 502 });
        }

        const body = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;

        const tokens = Object.entries(MAP).map(([symbol, meta]) => {
            const row = body[meta.id];
            const change24 = Number(row?.usd_24h_change ?? 0);
            return {
                symbol,
                name: meta.name,
                score: scoreFromChange(change24),  // <- unified scoring (24h)
                delta24: change24,                 // shown as ▲x.xx%
            };
        });

        return NextResponse.json({ tokens });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
    }
}
