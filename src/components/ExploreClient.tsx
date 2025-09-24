"use client";

import * as React from "react";
import { useTokenDetail } from "@/hooks/useTokenDetail";
import { TOKEN_META } from "@/lib/tokens";
import Link from "next/link";

type Evidence = {
    source: string;
    title: string;
    polarity: "Positive" | "Negative" | "Neutral";
    url?: string;
    // (optional) date fields if I want to add later
};

type TokenData = {
    symbol: string;
    name: string;
    evidence: Evidence[];
    priceUsd?: number;
    score: number;
    confidence: string;
    twentyFour: any[];
    sevenDay: any[];
    deltaPct?: number;
};

type SourceKey = "All" | "Reddit" | "News" | "Other";

function normalizeSource(label: string): Exclude<SourceKey, "All"> {
    const s = (label || "").toLowerCase();
    if (s.includes("reddit")) return "Reddit";
    if (
        s.includes("news") ||
        s.includes("article") ||
        s.includes("blog") ||
        s.includes("press") ||
        s.includes("coindesk") ||
        s.includes("cointelegraph") ||
        s.includes("decrypt") ||
        s.includes("medium") ||
        s.includes("substack")
    ) {
        return "News";
    }
    return "Other";
}

const SOURCE_ORDER: Exclude<SourceKey, "All">[] = ["Reddit", "News", "Other"];

export default function ExploreClient({ initialSymbol = "btc" }: { initialSymbol?: string }) {
    const [symbol, setSymbol] = React.useState(initialSymbol);
    const [sourceSel, setSourceSel] = React.useState<SourceKey>("All");
    const [q, setQ] = React.useState("");

    const { data, error, isLoading } = useTokenDetail(symbol, "7d") as {
        data?: TokenData;
        error?: unknown;
        isLoading: boolean;
    };

    const tokens = React.useMemo(
        () => Object.entries(TOKEN_META).map(([value, m]) => ({ value, label: m.label })),
        []
    );

    const grouped = React.useMemo(() => {
        const list = (data?.evidence ?? [])
            .filter((e) => (sourceSel === "All" ? true : normalizeSource(e.source) === sourceSel))
            .filter((e) => (q.trim() ? e.title.toLowerCase().includes(q.trim().toLowerCase()) : true));

        const map: Record<Exclude<SourceKey, "All">, Evidence[]> = { Reddit: [], News: [], Other: [] };
        for (const e of list) {
            map[normalizeSource(e.source)].push(e);
        }
        return map;
    }, [data?.evidence, sourceSel, q]);

    const meta = TOKEN_META[symbol];

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {meta && (
                        <img
                            src={meta.logo}
                            alt={`${meta.label} logo`}
                            className="h-10 w-10 rounded-full ring-1 ring-white/10 object-contain bg-slate-800"
                            onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
                        />
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold">
                            Explore <span className="text-slate-400">/ {data?.name ?? symbol.toUpperCase()}</span>
                        </h1>
                        <p className="text-sm text-slate-400">
                            All sources in one place — filter by source and keyword.
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-slate-300 text-sm">
                        Token:&nbsp;
                        <select
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="ml-1 bg-slate-800/60 ring-1 ring-white/10 rounded-md px-2 py-1 text-slate-100"
                        >
                            {tokens.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-slate-300 text-sm">
                        Source:&nbsp;
                        <select
                            value={sourceSel}
                            onChange={(e) => setSourceSel(e.target.value as SourceKey)}
                            className="ml-1 bg-slate-800/60 ring-1 ring-white/10 rounded-md px-2 py-1 text-slate-100"
                            aria-label="Filter by source"
                        >
                            <option>All</option>
                            <option>Reddit</option>
                            <option>News</option>
                            <option>Other</option>
                        </select>
                    </label>

                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search titles..."
                        className="bg-slate-800/60 ring-1 ring-white/10 rounded-md px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                    />
                    <Link
                        href={`/token/${symbol}`}
                        className="rounded-md bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm text-slate-200"
                    >
                        ← Back to Detail
                    </Link>
                </div>
            </div>

            {/* Body */}
            <div className="mt-6">
                {error ? (
                    <p className="text-rose-300">Failed to load: {String(error)}</p>
                ) : isLoading ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                                <div className="h-5 w-24 bg-white/10 rounded mb-3" />
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="h-4 w-full bg-white/5 rounded mb-2" />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {SOURCE_ORDER.map((col) => (
                            <section
                                key={col}
                                className="rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur overflow-hidden"
                            >
                                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">{col}</h3>
                                    <span className="text-xs text-slate-400">
                                        {(grouped[col] ?? []).length} item{(grouped[col] ?? []).length === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <ul className="divide-y divide-white/10 max-h-[70vh] overflow-auto">
                                    {(grouped[col] ?? []).length === 0 && (
                                        <li className="px-4 py-6 text-slate-500 text-sm">No results.</li>
                                    )}
                                    {(grouped[col] ?? []).map((e, i) => (
                                        <li key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                {e.url ? (
                                                    <a
                                                        href={e.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="no-underline hover:opacity-80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
                                                    >
                                                        <p className="truncate">{e.title}</p>
                                                    </a>
                                                ) : (
                                                    <p className="truncate">{e.title}</p>
                                                )}
                                                <p className="text-[11px] text-slate-400">{col}</p>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded text-[11px] ring-1 ${
                                                    e.polarity === "Positive"
                                                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                                                        : e.polarity === "Negative"
                                                        ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                                                        : "bg-slate-500/15 text-slate-300 ring-slate-400/30"
                                                }`}
                                            >
                                                {e.polarity}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

