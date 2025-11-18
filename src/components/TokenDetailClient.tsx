"use client"
import TrendLine from "./TrendLine";
import { useState } from "react";
import { useTokenDetail } from "../hooks/useTokenDetail";
import { TOKEN_META } from "@/lib/tokens";


type DayRow = { date: string; price: number; sentiment: number };
type Evidence = { source: string; title: string; polarity: "Positive" | "Negative" | "Neutral"; url?: string };
type TokenData = {
    symbol: string; name: string; score: number; confidence: string;
    scoreReasons: string[];
    twentyFour: DayRow[]; sevenDay: DayRow[];
    drivers: { positive: string[]; negative: string[] };
    sourceMix: { reddit: number; news: number; other: number };
    evidence: Evidence[];
    priceUsd?: number;
    deltaPct?: number;
};

function normalizeSource(label: string): "Reddit" | "News" | "Other" {
    const s = (label || "").toLowerCase().trim();

    // Reddit
    if (s.includes("reddit")) return "Reddit";

    // News/articles/blogs/press/vendors etc.
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

    // "RSS/Other", "rss", generic, or anything unknown
    if (s.includes("rss")) return "Other";
    return "Other";
}

function mixFromEvidence(list: { source: string }[]) {
    const total = list.length;
    if (total === 0) return { reddit: 0, news: 0, other: 0 };

    const counts = { reddit: 0, news: 0, other: 0 };
    for (const e of list) {
        const norm = normalizeSource(e.source);
        if (norm === "Reddit") counts.reddit++;
        else if (norm === "News") counts.news++;
        else counts.other++;
    } 

    type Key = keyof typeof counts;

    const raw: Record<Key, number> = {
        reddit: (counts.reddit / total) * 100,
        news: (counts.news / total) * 100,
        other: (counts.other / total) * 100,
    };

    const rounded: Record<Key, number> = {
        reddit: Math.floor(raw.reddit),
        news: Math.floor(raw.news),
        other: Math.floor(raw.other),
    };

    let remainder = 100 - (rounded.reddit + rounded.news + rounded.other);

    const order: Key[] = (["reddit", "news", "other"] as const)
        .slice()
        .sort((a: Key, b: Key) => raw[b] - raw[a]);

    let i = 0;
    while (remainder-- > 0) {
        const k: Key = order[i % order.length];
        rounded[k]++;
        i++;
    }

    return rounded;
}

function confidenceFromScore(score: number) {
    if (score >= 70) return { label: "High", cls: "text-emerald-300" };
    if (score >= 60) return { label: "Medium", cls: "text-amber-300" };
    return { label: "Low", cls: "text-rose-300" };
}

function countPolarities(list: { polarity: "Positive" | "Negative" | "Neutral" }[]) {
    return list.reduce(
        (acc, cur) => {
            acc[cur.polarity]++
            return acc
        },
        { Positive: 0, Negative: 0, Neutral: 0 }
    )
}

function polarityChipClass(p: "Positive" | "Negative" | "Neutral") {
    if (p === "Positive") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
    if (p === "Negative") return "bg-rose-500/15 text-rose-300 ring-rose-400/30"
    return "bg-slate-500/15 text-slate-300 ring-slate-400/30"
}


const STOP = new Set([
    "the","a","an","to","of","and","in","on","for","with","as","is","are",
    "new","up","over","from","vs","by","at","this","that","into","than","its",
    "has", "have","had","will","can","be","was","were"
]);

function topKeywords(
    items: Evidence[],
    polarity: "Positive" | "Negative" | "Neutral",
    limit = 3
) {
    const freq: Record<string, number> = {};
    items
        .filter((e) => e.polarity === polarity)
        .forEach((e) => {
            e.title
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .forEach((w) => {
                    if (w.length < 3 || STOP.has(w)) return;
                    freq[w] = (freq[w] || 0) + 1;
                });
        });
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([w]) => w);
}


export default function TokenDetailClient({ symbol = "btc" }: { symbol?: string }) {
    const [windowSel, setWindowSel] = useState<"24h" | "7d">("7d");
    const [sourceSel, setSourceSel] = useState<"All" | "Reddit" | "News" | "Other">("All");
    const [modalOpen, setModalOpen] = useState(false);
    const [mobileTimeOpen, setMobileTimeOpen] = useState(false);
    const [mobileSourceOpen, setMobileSourceOpen] = useState(false);


    const { data, error, isLoading } = useTokenDetail(symbol, windowSel) as {
        data?: TokenData;
        error?: unknown;
        isLoading: boolean;
    };

    const rows = windowSel === "24h" 
        ? (data?.twentyFour ?? [])
        : (data?.sevenDay ?? []);

    

    if (error) return <p className="text-red-400 p-6" role="alert">Error: {String(error)}</p>;
    if (isLoading || !data) return <p className="p-6 text-slate-300">Loading...</p>

    // Score color/glow mapping (static class strings so Tailwind can tree-shake safely)
    let badgeColor = 
        "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 shadow-yellow-400/60";
    if (data.score >= 90)
        badgeColor = "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-emerald-400/60";
    else if (data.score >= 60 && data.score < 70)
        badgeColor = "border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-amber-400/60";
    else if (data.score < 60)
        badgeColor = "border-rose-400/30 bg-rose-400/10 text-rose-300 shadow-rose-400/60";

    const deltaPct =
        typeof data.deltaPct === "number"
            ? data.deltaPct
            : rows.length > 1
                ? ((rows.at(-1)!.price - rows[0].price) / rows[0].price) * 100
                : 0;

    const allEvidence = data.evidence ?? [];
    const filteredEvidence = 
        sourceSel === "All"
        ? allEvidence
        : allEvidence.filter(e => normalizeSource(e.source) === sourceSel);

    const sourceMix = mixFromEvidence(filteredEvidence);

    const driversPos = topKeywords(filteredEvidence, "Positive");
    const driversNeg = topKeywords(filteredEvidence, "Negative");
    const driversNeu = topKeywords(filteredEvidence, "Neutral");
    const conf = confidenceFromScore(data.score);

    const polarities = countPolarities(filteredEvidence)
    const topEvidence = filteredEvidence.slice(0, 3)
    const updatedAt = new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit", month:"short", day: "2-digit" })

    const summaryLine = (() => {
        const dir = deltaPct >= 0 ? "up" : "down"
        const dirIcon = deltaPct >= 0 ? "▲" : "▼"
        const filt = sourceSel === "All" ? "all sources" : sourceSel
        return `Score ${data.score} with ${dirIcon} ${Math.abs(deltaPct).toFixed(2)}% ${dir} over 24h; based on ${filt.toLowerCase()}.`
    })()


    return (
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
            {/* Page Header */}
            <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Left: Logo + name */}
                <div className="flex items-center gap-3">
                    {(() => {
                        const key = (symbol || "").toLowerCase();
                        const meta = TOKEN_META[key];
                        return meta ? (
                            <img
                                src={meta.logo}
                                alt={`${meta.label} logo`}
                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-1 ring-white/10 object-contain bg-slate-800 mt-1"
                                onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
                            />
                        ) : null;
                    })()}
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
                            {data.name}{" "} 
                            <span className="text-slate-400 text-xl sm:text-2xl">
                                ({data.symbol})
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base text-slate-400">
                            Price:&nbsp;
                            <span className="font-medium text-white">
                                {typeof data?.priceUsd === "number" ? `$${data.priceUsd.toLocaleString()}` : "—"}
                            </span>
                            <span className="mx-2 text-slate-500">•</span>
                            Confidence: 
                            <span className={`${conf.cls} font-medium`}> {conf.label}</span>
                        </p>
                    </div>
                </div>
                
                {/* Right: time controls + why link */}
                <div className="flex items-center self-start gap-3 md:self-auto">
                    {/* desktop toggle */}
                    <div 
                        className="hidden md:inline-flex rounded-full bg-slate-800/60 ring-1 ring-white/10 p-1" 
                        role="tablist" 
                        aria-label="Time window"
                    >
                        {(["24h","7d"] as const).map(v => (
                            <button
                                key={v}
                                role="tab"
                                aria-selected={windowSel === v}
                                onClick={() => setWindowSel(v)}
                                className={`cursor-pointer px-3 py-1 rounded-full text-sm ${
                                    windowSel === v
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700/40"
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    {/* Select (mobile) */}
                    <div className="relative md:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileTimeOpen((v) => !v)}
                            className="cursor-pointer text-slate-300 text-sm bg-slate-800/60 ring-1 ring-white/10 rounded-md px-3 py-1 flex items-center gap-2"
                        >
                            <span>Time:</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-slate-100">
                                {windowSel}
                                <span aria-hidden>▾</span>
                            </span>
                        </button>

                        {mobileTimeOpen && (
                            <div className="absolute left-0 top-full mt-2 w-24 rounded-lg bg-slate-900 ring-1 ring-white/10 shadow-lg z-20">
                                {(["24h", "7d"] as const).map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => {
                                            setWindowSel(v);
                                            setMobileTimeOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs cursor-pointer hover:bg-slate-800 ${
                                            windowSel === v
                                                ? "text-emerald-300"
                                                : "text-slate-200"
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* content grid */}
            <div className="grid md:grid-cols-5 gap-6 mt-8">
                {/* Trend */}
                <section className="md:col-span-3 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                    <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg sm:text-xl font-semibold">
                            {windowSel} Trend (PoC)
                        </h2>

                        {/* score badge + Δ(window) */}
                        <div className="flex flex-col items-start sm:items-end gap-1">
                            <div className="flex items-center gap-3">
                            {/* score badge */}
                                <div className="relative group">
                                    <div 
                                        className={`rounded-full border ${badgeColor} px-4 py-1.5 text-sm sm:text-base
                                                    font-semibold shadow-[0_0_20px_-8px] `}        
                                    >
                                        Score: {data.score}
                                    </div>

                                    {/* Hover legend (appears when hovering the score) */}
                                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 absolute right-0 top-full mt-2 z-10">
                                        <div className="w-64 rounded-xl bg-black ring-1 ring-white/10 p-3 shadow-xl">
                                            <p className="text-xs font-semibold text-slate-200 mb-2">
                                                Score legend
                                            </p>
                                            <ul className="space-y-1 text-xs text-slate-300">
                                                <li className="flex items-center gap-2">
                                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                                                    ≥ 90: strong positive
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                                                    70 - 89: positive
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                                                    60 - 69: mixed/neutral
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                                                    &lt; 59: negative
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* triangle percentage */}
                                <span 
                                    className={`text-sm sm:text-base tabular-nums font-semibold ${
                                        deltaPct >= 0 
                                            ? "text-emerald-300" 
                                            : "text-rose-300"
                                    }`} 
                                >
                                    {deltaPct >= 0 ? "▲" : "▼"} 
                                    {Math.abs(deltaPct).toFixed(2)}%
                                </span>
                            </div>

                            {/* why this score link */}
                            <button
                                onClick={() => setModalOpen(true)}
                                className="cursor-pointer text-[11px] sm:text-xs text-slate-300 hover:text-white underline underline-offset-4 self-end"
                            >
                                Why this score?
                            </button>  
                        </div>
                    </div>   

                    <div className="px-4 pt-4">
                        <TrendLine rows={rows} windowSel={windowSel}/>
                    </div>
                </section>

                {/* Drivers + Mix */}
                <section className="md:col-span-2 space-y-6">
                    {/* Drivers */}
                    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur p-6">
                        <h3 className="text-lg font-semibold mb-3">Drivers & Sources</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-slate-400 text-sm mb-2">Positive Mix</p>
                                <div className="flex flex-wrap gap-2">
                                    {driversPos.length ? (
                                        driversPos.map((t, i) => (
                                        <span key={i} 
                                            className="px-2 py-1 rounded-md text-xs bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
                                            {t}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-slate-500 text-xs">No positive drivers yet.</span>
                                )}
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-slate-400 text-sm mb-2">Neutral Mix</p>
                                <div className="flex flex-wrap gap-2">
                                    {driversNeu.length ? (
                                        driversNeu.map((t, i) => (
                                        <span key={i} 
                                            className="px-2 py-1 rounded-md text-xs bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/30">
                                            {t}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-slate-500 text-xs">No neutral drivers yet.</span>
                                )}
                                </div>
                            </div>



                            <div>
                                <p className="text-slate-400 text-sm mb-2">Negative Mix</p>
                                <div className="flex flex-wrap gap-2">
                                    {driversNeg.length ? (
                                        driversNeg.map((t, i) => (
                                            <span key={i} 
                                                className="px-2 py-1 rounded-md text-xs bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30">
                                                {t}
                                            </span>
                                    ))
                                ) : (
                                    <span className="text-slate-500 text-xs">No negative drivers yet.</span>
                                )}
                                </div>
                            </div>
                        </div>

                        {/* Source mix bars */}
                        <div className="mt-5">
                            <p className="text-slate-400 text-sm mb-2">Source Mix</p>
                            {(["reddit","news","other"] as const).map((k) => (
                                <div key={k} className="flex items-center gap-3 mb-2">
                                    <span className="w-16 text-xs uppercase text-slate-400">{k}</span>
                                    <div className="flex-1 h-2 rounded bg-slate-800 ring-1 ring-white/10 overflow-hidden">
                                        <div className="h-full bg-slate-300" style={{ width: `${sourceMix[k]}%` }} />
                                    </div>
                                    <span className="w-10 text-right tabular-nums text-slate-300 text-xs">{sourceMix[k]}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Evidence feed, full-width on small screens */}
                <section className="md:col-span-5 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                    <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Evidence Feed</h3>

                        <div className="text-slate-300 text-sm flex items-center gap-2">
                            <span className="hidden sm:inline">Source:</span>

                            {/* Desktop: native select */}
                            <select
                                value={sourceSel}
                                onChange={(e) => setSourceSel(e.target.value as "All" | "Reddit" | "News" | "Other")}
                                className="hidden sm:block bg-slate-800/60 ring-1 ring-white/10 rounded-md px-2 py-1 text-slate-100"
                                aria-label="Filter evidence by source"
                            >
                                <option value="All">All</option>
                                <option value="Reddit">Reddit</option>
                                <option value="News">News</option>
                                <option value="Other">Other</option>
                            </select>

                            {/* Mobile: pill + dropdown under it */}
                            <div className="relative sm:hidden">
                                <button
                                    type="button"
                                    onClick={() => setMobileSourceOpen((v) => !v)}
                                    className="bg-slate-800/60 ring-1 ring-white/10 rounded-md px-3 py-1 flex items-center gap-1 text-xs text-slate-100 cursor-pointer"
                                    aria-label="Filter evidence by source"
                                >
                                    <span>{sourceSel}</span>
                                    <span aria-hidden>▾</span>
                                </button>

                                {mobileSourceOpen && (
                                    <div className="absolute left-0 top-full mt-2 w-28 rounded-lg bg-slate-900 ring-1 ring-white/10 shadow-lg z-20">
                                        {(["All", "Reddit", "News", "Other"] as const).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    setSourceSel(opt);
                                                    setMobileSourceOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs cursor-pointer hover:bg-slate-800 ${
                                                    sourceSel === opt ? "text-emerald-300" : "text-slate-200"
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <ul className="divide-y divide-white/10">
                        {filteredEvidence.map((e, i) => (
                            <li key={i} className="px-6 py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        {e.url ? (
                                            <a className="no-underline hover:opacity-80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm" href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`Open source: ${e.title}`}>
                                                {e.title}
                                            </a>
                                        ) : (
                                            e.title

                                        )}
                                        </p>
                                    <p className="text-xs text-slate-400">{normalizeSource(e.source)}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ring-1 ${
                                    e.polarity === "Positive" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                                    : e.polarity === "Negative" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                                    : "bg-slate-500/15 text-slate-300 ring-slate-400/30"
                                }`}>
                                    {e.polarity}
                                </span>
                            </li>
                        ))}
                        {filteredEvidence.length === 0 && (
                            <li className="px-6 py-6 text-slate-400 text-sm">No evidence for this source.</li>
                        )}
                    </ul>
                </section>
            </div>

            {/* Why this score? modal */}
            {modalOpen && (
                <div 
                    className="fixed inset-0 z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="score-modal-title"
                >
                    <div 
                        className="absolute inset-0 bg-black/60 cursor-pointer"
                        onClick={() => setModalOpen(false)} 
                    />

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-xl rounded-2xl bg-black ring-1 ring-white/10 p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <h4 id="score-modal-title" className="text-lg font-semibold">Why this score?</h4>
                                <button 
                                    type="button"
                                    onClick={() => setModalOpen(false)} 
                                    className="cursor-pointer text-slate-400 hover:text-white" 
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Live brief */}
                            <div className="space-y-4">
                                {/* Headline line */}
                                <p className="text-slate-200">{summaryLine}</p>

                                {/* KPI chips */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="px-2.5 py-1 rounded-full text-xs ring-1 ring-white/10 bg-white/5">
                                        Price: <span className="font-median text-white">${(data.priceUsd ?? 0).toLocaleString()}</span>
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs ring-1 ring-white/10 ${deltaPct >= 0 ? "text-emerald-300 bg-emerald-500/10" : "text-rose-300 bg-rose-500/10"}`}>
                                        {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(2)}% (24h)
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-xs ring-1 ring-white/10 bg-white/5">
                                        Positive: <span className="text-emerald-300 font-medium">{polarities.Positive}</span>
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-xs ring-1 ring-white/10 bg-white/5">
                                        Neutral: <span className="text-slate-300 font-medium">{polarities.Neutral}</span>
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-xs ring-1 ring-white/10 bg-white/5">
                                        Negative: <span className="text-rose-300 font-medium">{polarities.Negative}</span>
                                    </span>
                                </div>

                                {/* Top evidence (respects current Source filter) */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">
                                        Recent evidence (top {topEvidence.length}{sourceSel !== "All" ? ` • ${sourceSel}` : ""})
                                    </p>
                                    <ul className="space-y-2">
                                        {topEvidence.map((e, i) => (
                                            <li key={i} className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    {e.url ? (
                                                        <a
                                                            href={e.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="no-underline hover:opacity-80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
                                                            aria-label={`Open source: ${e.title}`}
                                                        >
                                                            <p className="text-sm text-slate-200 truncate">{e.title}</p>
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-slate-200 truncate">{e.title}</p>
                                                    )}
                                                    <p className="text-[11px] text-slate-400">{normalizeSource(e.source)}</p>
                                                </div>
                                                <span className={`px-1.5 py-0.5 rounded text-[11px] ring-1 ${polarityChipClass(e.polarity)}`}>
                                                    {e.polarity}
                                                </span>
                                            </li>
                                        ))}
                                        {topEvidence.length === 0 && (
                                            <li className="text-sm text-slate-400">No recent items for this source.</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Footer line */}
                                <p className="text-[11px] text-slate-500">Updated {updatedAt}</p>
                            </div>

                            <div className="mt-6 text-right">
                                <button 
                                    type="button" 
                                    onClick={() => setModalOpen(false)} 
                                    className=" cursor-pointer rounded-lg bg-white text-black hover:bg-gray-400 px-4 py-2"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}