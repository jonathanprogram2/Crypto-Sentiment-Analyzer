"use client"

import Link from "next/link";
import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTokenDetail } from "@/hooks/useTokenDetail";
import { createPortal } from "react-dom";
import HeatmapTreemapPlotly from "./HeatmapTreemapPlotly";
import HowItWorks from "./HowItWorks";

const TOKEN_META: Record<string, { label: string; logo: string }> = {
    btc: { label: "Bitcoin (BTC)", logo: "/tokens/btc.png" },
    eth: { label: "Ethereum (ETH)", logo: "/tokens/eth.png" },
    sol: { label: "Solana (SOL)", logo: "/tokens/sol.png" },
};
const TOKENS = Object.entries(TOKEN_META).map(([value, m]) => ({ value, label: m.label }));



// Small, local score->glow helper (mirrors the detail page logic to keep the consistency)
function scoreGlowClasses(score: number) {
    if (score >= 90) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-emerald-400/60";
    if (score >= 70) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 shadow-yellow-400/60";
    if (score >= 60) return "border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-amber-400/60";
    return "border-rose-400/30 bg-rose-400/10 text-rose-300 shadow-rose-400/60";
}

// One column in the compare grid
function ComparePane({ symbol }: { symbol: string }) {
    const { data, isLoading, error } = useTokenDetail(symbol, "7d") as {
        data?: {
            symbol: string;
            name: string;
            score: number;
            priceUsd?: number;
            deltaPct?: number;
            evidence: { source: string; title: string; polarity: "Positive" | "Negative" | "Neutral"; url?: string }[];
        };
        isLoading: boolean;
        error?: unknown;
    };

    const meta = TOKEN_META[symbol];
    if (!meta) return null;

    const glow = scoreGlowClasses(Number(data?.score ?? 0));
    const price = typeof data?.priceUsd === "number" ? `$${data!.priceUsd!.toLocaleString()}` : "—";
    const deltaPct = 
        typeof data?.deltaPct === "number" ? data!.deltaPct! : 0;

    

    return (
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 sm:px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <img
                        src={meta.logo}
                        alt={`${meta.label} logo`}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-1 ring-white/10 object-contain bg-slate-800"
                        onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                    />
                    <div className="min-w-0">
                        <p className="font-semibold leading-tight text-sm sm:text-base truncate">{data?.name ?? meta.label.split(" (")[0]}</p>
                        <p className="text-[11px] sm:text-xs text-slate-400">({symbol.toUpperCase()})</p>
                    </div>
                </div>

                {/* Score + Δ */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div
                        className={`rounded-full border ${glow} px-3 py-1 text-xs sm:text-sm font-semibold shadow-[0_0_20px_-8px] whitespace-nowrap`}
                    >
                        Score: {isLoading || !data ? "..." : data!.score}
                    </div>
                    <span
                        className={`tabular-nums text-xs sm:text-sm font-semibold ${deltaPct >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                    >
                        {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 grid gap-4 grid-rows-[auto_auto_1fr] min-h-0">
                {/* Price */}
                <div className="text-sm text-slate-300">
                    <span className="text-slate-400">Price:</span><span className="font-medium text-white">{price}</span>
                </div>

                {/* Tiny legend to match detail look */}
                <div className="text-[11px] text-slate-400">
                    Score legend: <span className="text-emerald-300">≤90</span> |
                    <span className="text-yellow-300"> 89 - 70</span> |
                    <span className="text-amber-300"> 69 - 60</span> |
                    <span className="text-rose-300"> ≥59</span>
                </div>

                {/* Evidence (scrolls) */}
                <div className="rounded-xl bg-black/20 ring-1 ring-white/10 overflow-auto">
                    <div className="px-4 py-2 border-b border-white/10 text-sm font-semibold">Evidence (latest)</div>
                    {error ? (
                        <p className="p-4 text-rose-300 text-sm">Failed to load.</p>
                    ) : isLoading || !data ? (
                        <ul className="divide-y divide-white/10">
                            {[...Array(3)].map((_, i) => (
                                <li key={i} className="px-4 py-3 text-slate-500 text-sm">Loading...</li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {(data!.evidence ?? []).slice(0, 4).map((e, i) => (
                                <li key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate">{e.url ? <a className="underline" href={e.url} target="_blank">{e.title}</a> : e.title}</p>
                                        <p className="text-xs text-slate-400">{e.source}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[11px] ring-1 ${
                                        e.polarity === "Positive" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                                        : e.polarity === "Negative" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                                        : "bg-slate-500/15 text-slate-300 ring-slate-400/30"
                                    }`}>
                                        {e.polarity}
                                    </span>
                                </li>
                            ))}
                            {(data!.evidence ?? []).length === 0 && (
                                <li className="px-4 py-3 text-slate-400 text-sm">No items.</li>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

function HeatmapCompare({ left, right }: { left: string; right: string }) {
    const { data: A } = (useTokenDetail(left, "7d") as any) || {};
    const { data: B } = (useTokenDetail(right, "7d") as any) || {};

    type Pol = "Positive" | "Neutral" | "Negative";
    const buckets: Pol[] = ["Positive", "Neutral", "Negative"];

    function tally(data?: { evidence?: { polarity: Pol }[] }) {
        const t = { Positive: 0, Neutral: 0, Negative: 0 } as Record<Pol, number>;
        (data?.evidence ?? []).forEach(e => { t[e.polarity]++; });
        return t;
    }

    const tA = tally(A);
    const tB = tally(B);
    const max = Math.max(...["Positive","Neutral","Negative"].map(k => tA[k as Pol] + tB[k as Pol]), 1);

    // map sentiment -> base color
    const base = {
        Positive: { r: 34, g: 197, b: 94 }, 
        Neutral: { r: 148, g: 163, b: 184 }, 
        Negative: { r: 244, g: 63, b: 94 }, 
    } as const;

    function cellStyle(sent: Pol, v: number) {
        // intensity 10%...100% based 
        const alpha = Math.max(0.1, Math.min(1, v / max));
        const { r, g, b } = base[sent];
        return {
            backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
            border: "1px solid rgba(255,255,255,0.08)"
        } as React.CSSProperties;
    }

    return (
        <div className="w-full">
            <div className="mb-3 text-sm text-slate-300">
                Heatmap compares evidence polarity counts for each token (last 7d).
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
                <div />
                <div className="text-center font-medium text-slate-200 uppercase">{(A?.symbol ?? left).toUpperCase()}</div>
                <div className="text-center font-medium text-slate-200 uppercase">{(B?.symbol ?? right).toUpperCase()}</div>

                {buckets.map(sent => (
                    <React.Fragment key={sent}>
                        <div className="self-center font-medium text-slate-300">{sent}</div>

                        <div className="rounded-md p-3 text-center text-slate-900 font-semibold"
                                style={cellStyle(sent, tA[sent])}>
                            {tA[sent]}
                        </div>

                        <div className="rounded-md p-3 text-center text-slate-900 font-semibold"
                                style={cellStyle(sent, tB[sent])}>
                            {tB[sent]}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

export default function NavBar() {
    const pathname = usePathname();
    const search = useSearchParams();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    

    // Detect current token when on /token/[symbol]
    const isDetail = pathname?.startsWith("/token/");
    const currentSymbol = useMemo(() => {
        if (!isDetail) return "btc";
        const last = pathname!.split("/").filter(Boolean).pop()!;
        return last.toLowerCase();
    }, [pathname, isDetail]);

    const isExplore = pathname?.startsWith("/explore");
    const exploreSymbol = (search?.get("symbol") || "btc").toLowerCase();
    const tokenDetailHref = `/token/${isExplore ? exploreSymbol : currentSymbol}`;
    

    const [rightA, setRightA] = useState<string>("eth");

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        // reserved for future init
    }, [currentSymbol]);


    const leftDetail = useTokenDetail(currentSymbol, "7d") as any;
    const rightDetail = useTokenDetail(rightA, "7d") as any;

    const crumb = isDetail ? pathname?.split("/").filter(Boolean).slice(-1)[0]?.toUpperCase() : null;

    return (
        <div className="sticky top-0 z-40 w-full nav-color backdrop-blur border-b border-white/10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Mobile breadcrumb: compact */}
                    <div className="flex items-center gap-2 md:hidden">
                        {isDetail ? (
                            <button
                                className="flex items-center gap-1 text-black text-sm font-extrabold hover:text-white cursor-pointer"
                                onClick={() => router.back()}
                            >
                               <span>←</span> 
                               <span>Back</span>
                            </button>
                        ) : (
                            <Link 
                                href="/" 
                                className="text-black text-sm hover:text-white cursor-pointer font-extrabold"
                            >
                                Home
                            </Link>
                        )}

                        {isDetail && (
                            <span className="text-xs text-black/80 truncate max-w-[4rem] uppercase">
                                {crumb}
                            </span>
                        )}
                    </div>

                    {/* Desktop breadcrumb: full trail */}
                    <div className="hidden md:flex items-center gap-3">
                        {isDetail ? (
                            <button
                                className="text-black hover:text-white cursor-pointer font-extrabold"
                                onClick={() => router.back()}
                            >
                                ← Back
                            </button>
                        ) : null}
                        <span className="text-black">/</span>
                        <Link
                            href="/"
                            className="text-black hover:text-white cursor-pointer font-extrabold"
                        >
                            Home
                        </Link>  
                        {(isDetail || isExplore) && (
                            <>
                                <span className="text-black">/</span>
                                {isDetail ? (
                                    <span className="text-slate-200 font-sans">{crumb}</span>
                                ) : (
                                    <Link
                                        href={tokenDetailHref}
                                        className="text-black hover:text-white cursor-pointer font-extrabold"
                                        title="Go to selected token detail"
                                    >
                                        Token detail
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT: nav pills (slightly smaller on token detail mobile */}
                <div 
                    className={`flex items-center gap-2 md:gap-4 ${
                        isDetail ? "scale-[0.9] origin-right md:scale-100" : ""
                    }`}
                >
                    <button
                        className="nav-shimmer-btn nav-shimmer-neutral"
                        onClick={() => setOpen(true)}
                        type="button"
                    >
                        <span className="nav-shimmer-text">Compare</span>
                        <span className="nav-shimmer-layer" />
                    </button>

                    <button
                        className="nav-shimmer-btn nav-shimmer-primary"
                        type="button"
                        onClick={() => 
                            router.push(`/explore?symbol=${(isDetail ? currentSymbol : "btc")}`)
                        }
                    >
                        <span className="nav-shimmer-text">Explore</span>
                        <span className="nav-shimmer-layer" />
                    </button>
                    <HowItWorks />
                </div>
            </div>

            {open && 
                mounted && 
                    createPortal(
                        <div className="fixed inset-0 z-50">
                            <div 
                                className="fixed inset-0 bg-black/60" 
                                onClick={() => setOpen(false)} 
                                aria-hidden="true" 
                            />

                            {/* centered modal */}
                            <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
                                <div
                                    role="dialog" 
                                    aria-modal="true" 
                                    aria-labelledby="compare-title"
                                    className="
                                        compare-neon-modal
                                        w-full max-w-[19rem]
                                        sm:w-[92vw] sm:max-w-7xl 
                                        max-h-[calc(100vh-2rem)] 
                                        overflow-hidden flex flex-col
                                        text-slate-100
                                        scale-[0.9] sm:scale-100
                                    "
                                >

                                    {/* Modal header */}
                                    <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            {showHeatmap ? (
                                                <button
                                                    onClick={() => setShowHeatmap(false)}
                                                    className="rounded-md bg-black hover:bg-[#282821] px-3 py-1.5 text-slate-200 cursor-pointer"
                                                >
                                                    ← Back
                                                </button>
                                            ) : null}
                                            <h4 
                                                id="compare-title"
                                                className="text-base sm:text-lg font-semibold"
                                            >
                                                Compare tokens
                                            </h4>
                                            <span className="hidden sm:inline text-xs text-slate-400">
                                                (left is current token)
                                            </span>
                                            <span className="inline sm:hidden text-[11px] text-slate-400">
                                                (swipe to see both)
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!showHeatmap && (
                                                <button 
                                                    onClick={() => setShowHeatmap(true)}
                                                    className="rounded-full bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30 hover:bg-amber-500/25 px-3 py-1.5 text-xs sm:text-sm cursor-pointer"
                                                    title="Show sentiment heatmap"
                                                >
                                        
                                                    Who&apos;s Hot? <span aria-hidden>🔥</span> 
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Select row */}
                                    <div className="px-5 py-3 border-b border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                                        {/* Left (locked to current) */}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1"> 
                                                <span className="hidden md:inline">Left (current)</span>
                                                <span className="md:hidden">Top (current)</span>
                                            </label>
                                            <div className="w-full rounded-md bg-black text-slate-100 px-3 py-2 ring-1 ring-white/10 cursor-not-allowed opacity-75">
                                                {TOKEN_META[currentSymbol]?.label ?? currentSymbol.toUpperCase()}
                                            </div>
                                        </div>
                                
                                        {/* Right A*/}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">
                                                <span className="hidden md:inline">Right Token</span>
                                                <span className="md:hidden">Bottom Token</span>
                                            </label>
                                            <select
                                                className="w-full rounded-md bg-black text-slate-100 px-3 py-2 ring-1 ring-white/10 cursor-pointer"
                                                value={rightA}
                                                onChange={(e) => setRightA(e.target.value)}
                                            >
                                                {TOKENS.filter(t => t.value !== currentSymbol).map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Compare grid */}
                                    <div className="p-5 min-h-0 flex-1 overflow-y-auto">
                                        {showHeatmap ? (
                                            <div className="p-5">
                                                <HeatmapTreemapPlotly 
                                                    left={{
                                                        symbol: currentSymbol,
                                                        name: leftDetail?.data?.name ?? currentSymbol.toUpperCase(),
                                                        evidence: leftDetail?.data?.evidence ?? [],
                                                    }} 
                                                    right={{
                                                        symbol: rightA,
                                                        name: rightDetail?.data?.name ?? rightA.toUpperCase(),
                                                        evidence: rightDetail?.data?.evidence ?? [],
                                                    }} 
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                {/* mobile-only scroll hint */}
                                                <div className="md:hidden mb-3 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                                                    <span>Swipe up to see the second token</span>
                                                    <span aria-hidden>⬆️⬇️</span>
                                                </div>

                                                <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 min-h-0 flex-1 overflow-y-auto bg-black">
                                                    <ComparePane symbol={currentSymbol}/>
                                                    <ComparePane symbol={rightA}/>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-5 py-3 border-t border-white/10 bg-black/25 backdrop-blur-sm text-right">
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="rounded-lg bg-black hover:bg-[#282821] px-4 py-2 text-white cursor-pointer"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
        </div>
    );
}
