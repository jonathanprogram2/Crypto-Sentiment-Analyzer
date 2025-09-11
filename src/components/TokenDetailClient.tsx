"use client"
import TrendLine from "./TrendLine";
import { useState } from "react";
import { useTokenDetail } from "../hooks/useTokenDetail";

type DayRow = { date: string; price: number; sentiment: number };
type Evidence = { source: string; title: string; polarity: "Positive" | "Negative" | "Neutral"; url?: string };
type TokenData = {
    symbol: string; name: string; score: number; confidence: string;
    scoreReasons: string[];
    twentyFour: DayRow[]; sevenDay: DayRow[];
    drivers: { positive: string[]; negative: string[] };
    sourceMix: { reddit: number; news: number; other: number };
    evidence: Evidence[];
};

export default function TokenDetailClient({ symbol = "btc" }: { symbol?: string }) {
    const [windowSel, setWindowSel] = useState<"24h" | "7d">("7d");
    const [modalOpen, setModalOpen] = useState(false);
    const { data, rows, error, isLoading } = useTokenDetail(symbol, windowSel);

    if (error) return <p className="text-red-400 p-6" role="alert">Error: {String(error)}</p>;
    if (isLoading || !data) return <p className="p-6 text-slate-300">Loading...</p>

    const deltaPts =
        rows && rows.length > 1 ? Math.round((rows[rows.length - 1 ].sentiment - rows[0].sentiment) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-semibold tracking-tight">
                        {data.name} <span className="text-slate-400">({data.symbol})</span>
                    </h1>
                    <p className="text-base text-slate-400 mt-1">
                        Confidence: <span className="text-emerald-300 font-medium">{data.confidence}</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* time window toggle */}
                    <div className="inline-flex rounded-full bg-slate-800/60 ring-1 ring-white/10 p-1">
                        {(["24h","7d"] as const).map(v => (
                            <button
                                key={v}
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

                    

                    {/* why this score link */}
                    <button
                        onClick={() => setModalOpen(true)}
                        className="cursor-pointer text-slate-300 hover:text-white underline underline-offset-4"
                    >
                        Why this score?
                    </button>    
                </div>
            </header>

            {/* content grid */}
            <div className="grid md:grid-cols-5 gap-6 mt-8">

                {/* Trend */}
                <section className="md:col-span-3 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">{windowSel} Trend (PoC)</h2>

                        {/* score badge + Δ(window) */}
                        <div className="absolute -top-23 right-6 flex items-center gap-4">
                            <div 
                                className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2
                                        text-yellow-300 font-semibold shadow-[0_0_20px_-8px] shadow-yellow-400/60 text-xl md:text-2xl"
                                title="Sentiment score (0-100)"         
                            >
                            Score: {data.score}
                        </div>
                        <span 
                            className={`text-lg tabular-nums font-semibold md:text-2xl ${deltaPts >= 0 ? "text-emerald-300" : "text-rose-300"}`} 
                                title={`Change this period: ${deltaPts >= 0 ? "+" : ""}${deltaPts}`}
                            >
                                {deltaPts >= 0 ? "▲" : "▼"} {Math.abs(deltaPts)}
                        </span>
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
                                    {data.drivers.positive.map((t, i) => (
                                        <span key={i} className="px-2 py-1 rounded-md text-xs bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm mb-2">Negative Mix</p>
                                <div className="flex flex-wrap gap-2">
                                    {data.drivers.negative.map((t, i) => (
                                        <span key={i} className="px-2 py-1 rounded-md text-xs bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30">
                                            {t}
                                        </span>
                                    ))}
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
                                        <div className="h-full bg-slate-300" style={{ width: `${data.sourceMix[k]}%` }} />
                                    </div>
                                    <span className="w-10 text-right tabular-nums text-slate-300 text-xs">{data.sourceMix[k]}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Evidence feed, full-width on small screens */}
                <section className="md:col-span-5 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                    <div className="px-6 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold">Evidence Feed</h3>
                    </div>
                    <ul className="divide-y divide-white/10">
                        {data.evidence.map((e, i) => (
                            <li key={i} className="px-6 py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        {e.url ? (
                                            <a className="underline hover:opacity-80" href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`Open source: ${e.title}`}>
                                                {e.title}
                                            </a>
                                        ) : (
                                            e.title

                                        )}
                                        </p>
                                    <p className="text-xs text-slate-400">{e.source}</p>
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
                        <div className="w-full max-w-md rounded-2xl bg-slate-900 ring-1 ring-white/10 p-6 shadow-xl">
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

                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                {(data.scoreReasons?.length ? data.scoreReasons : ["No reasons available"]).map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                            <div className="mt-6 text-right">
                                <button 
                                    type="button" 
                                    onClick={() => setModalOpen(false)} 
                                    className=" cursor-pointer rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2"
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