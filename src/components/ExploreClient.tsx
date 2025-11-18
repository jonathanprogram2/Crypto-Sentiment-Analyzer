"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HeadlineCard from "./HeadlineCard";
import { useTokenDetail } from "@/hooks/useTokenDetail";
import { useRouter } from "next/navigation";



type Pol = "Positive" | "Neutral" | "Negative";
type Evidence = { title: string; source: string; url?: string; polarity: Pol; ts?: string };

const TOKENS = [
    { value: "btc", label: "Bitcoin (BTC)" },
    { value: "eth", label: "Ethereum (ETH)" },
    { value: "sol", label: "Solana (SOL)" },
];

const SOURCES: Array<"All" | "Reddit" | "News" | "Other"> = ["All", "Reddit", "News", "Other"];

export default function ExploreClient({ initialSymbol = "btc" }: { initialSymbol?: string }) {
    const [symbol, setSymbol] = useState(initialSymbol);
    const [source, setSource] = useState<"All" | "Reddit" | "News" | "Other">("All");
    const [q, setQ] = useState("");
    const { data } = useTokenDetail(symbol, "7d") as any;
    const router = useRouter();

    const [symbolOpen, setSymbolOpen] = useState(false);
    const [sourceOpen, setSourceOpen] = useState(false);
    const symbolRef = useRef<HTMLDivElement | null>(null);
    const sourceRef = useRef<HTMLDivElement | null>(null);

    // close menus on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as Node;
            if (symbolOpen && symbolRef.current && !symbolRef.current.contains(target)) {
                setSymbolOpen(false);
            }
            if (sourceOpen && sourceRef.current && !sourceRef.current.contains(target)) {
                setSourceOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [symbolOpen, sourceOpen]);

    const items = useMemo(() => {
        let list = (data?.evidence ?? []) as Evidence[];
        if (source !== "All") list = list.filter(e => e.source.toLowerCase().includes(source.toLowerCase()));
        if (q) list = list.filter(e => e.title.toLowerCase().includes(q.toLowerCase()));
        return list;
    }, [data, source, q]);


    // url -> enrichment
    const [enrichMap, setEnrichMap] = useState<Record<string, any>>({});
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

    const currentTokenLabel = 
        TOKENS.find((t) => t.value === symbol)?.label ?? "Select token";


    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold">Explore</h1>
            </div>
        
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Token dropdown */}
                <div ref={symbolRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setSymbolOpen((v) => !v)}
                        className="flex items-center justify-between min-w-[11rem] bg-slate-800 ring-1 ring-white/10 rounded px-3 py-1.5 text-sm text-slate-100 cursor-pointer"
                    >
                        <span className="truncate">{currentTokenLabel}</span>
                        <span aria-hidden className="ml-2 text-xs opacity-80">
                            ▾
                        </span>
                    </button>

                    {symbolOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full rounded-md bg-slate-900 ring-1 ring-white/10 shadow-lg z-20">
                            {TOKENS.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => {
                                        setSymbol(t.value);
                                        setSymbolOpen(false);
                                        router.push(`/explore?symbol=${t.value}`);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-slate-700 ${
                                        t.value === symbol ? "bg-slate-800 text-white" : "text-slate-100"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Source dropdown */}
                <div ref={sourceRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setSourceOpen((v) => !v)}
                        className="flex items-center justify-between min-w-[7rem] bg-slate-800 ring-1 ring-white/10 rounded px-3 py-1.5 text-sm text-slate-100 cursor-pointer"
                    >
                        <span>{source}</span>
                        <span aria-hidden className="ml-2 text-xs opacity-80">
                            ▾
                        </span>
                    </button>

                    {sourceOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full rounded-md bg-slate-900 ring-1 ring-white/10 shadow-lg z-20">
                            {SOURCES.map((s) => (
                                <button 
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                        setSource(s);
                                        setSourceOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-slate-700 ${
                                        s === source ? "bg-slate-800 text-white" : "text-slate-100"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                    
               {/* Search */}
                <input 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                    placeholder="Search titles..."
                    className="bg-slate-800 ring-1 ring-white/10 rounded px-3 py-1.5 text-slate-100 w-full sm:w-72" 
                />
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