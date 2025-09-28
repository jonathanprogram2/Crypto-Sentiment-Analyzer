"use client";

import { useEffect, useMemo, useState } from "react";
import HeadlineCard from "./HeadlineCard";
import { useTokenDetail } from "@/hooks/useTokenDetail";
import { useRouter } from "next/navigation";
import Link from "next/link";


type Pol = "Positive" | "Neutral" | "Negative";
type Evidence = { title: string; source: string; url?: string; polarity: Pol; ts?: string };

const TOKENS = [
    { value: "btc", label: "Bitcoin (BTC)" },
    { value: "eth", label: "Ethereum (ETH)" },
    { value: "sol", label: "Solana (SOL)" },
];

export default function ExploreClient({ initialSymbol = "btc" }: { initialSymbol?: string }) {
    const [symbol, setSymbol] = useState(initialSymbol);
    const [source, setSource] = useState<"All" | "Reddit" | "News" | "Other">("All");
    const [q, setQ] = useState("");
    const { data } = useTokenDetail(symbol, "7d") as any;
    const router = useRouter();

    // url -> enrichment
    const [enrichMap, setEnrichMap] = useState<Record<string, any>>({});

    const items = useMemo(() => {
        let list = (data?.evidence ?? []) as Evidence[];
        if (source !== "All") list = list.filter(e => e.source.toLowerCase().includes(source.toLowerCase()));
        if (q) list = list.filter(e => e.title.toLowerCase().includes(q.toLowerCase()));
        return list;
    }, [data, source, q]);

    // batch enrich new URLs
    useEffect(() => {
        (async () => {
            const batch = items.filter(i => i.url && !enrichMap[i.url!]).slice(0, 20);
            if (!batch.length) return;
            const results = await Promise.all(
                batch.map(async i => {
                    try {
                        const r = await fetch(`/api/enrich?url=${encodeURIComponent(i.url!)}`);
                        const j = await r.json();
                        return [i.url!, j] as const;
                    } catch {
                        return [i.url!, {}] as const;
                    }
                })
            );
            setEnrichMap(prev => Object.fromEntries([...Object.entries(prev), ...results]));
        })();
    }, [items, enrichMap]);


    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold">Explore</h1>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.push(`/token/${symbol.toLowerCase()}`)}
                        className="rounded-md bg-white/40 hover:bg-white/50 px-3 py-1.5 text-slate-200 cursor-pointer"
                    >
                        ← Token detail
                    </button>
                    <Link href="/" className="rounded-md bg-white/40 hover:bg-white/50 px-3 py-1.5 text-slate-200">Back to Discover</Link>
                </div>
            </div>
        
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <select value={symbol} onChange={e=>setSymbol(e.target.value)}
                        className="bg-slate-800 ring-1 ring-white/10 rounded px-2 py-1 text-slate-100">
                    {TOKENS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <select value={source} onChange={e=>setSource(e.target.value as any)}
                        className="bg-slate-800 ring-1 ring-white/10 rounded px-2 py-1 text-slate-100">
                    <option>All</option><option>Reddit</option><option>News</option><option>Other</option>
                </select>

                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search titles..."
                        className="bg-slate-800 ring-1 ring-white/10 rounded px-3 py-1.5 text-slate-100 w-72" />
            </div>

            {/* grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it, i) => (
                    <HeadlineCard
                        key={`${it.title}-${i}`}
                        item={it}
                        enrich={it.url ? enrichMap[it.url] : undefined}
                        onOpen={() => (it.url ? window.open(it.url, "_blank") : undefined)}
                    />

                ))}
                {items.length === 0 && (
                    <div className="col-span-full text-slate-400">No results.</div>
                )}
            </div>
        </div>
    );
}

