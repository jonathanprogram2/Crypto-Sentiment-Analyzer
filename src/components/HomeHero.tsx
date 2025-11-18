"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

type TokenRow = {
    symbol: string;
    name: string;
    score: number;
    delta24: number;
};

const gradientBySymbol: Record<string, string> = {
    BTC: "from-amber-400/50 via-orange-500/40 to-amber-600/60",
    ETH: "from-sky-400/60 via-indigo-500/50 to-purple-500/70",
    SOL: "from-emerald-400/60 via-teal-500/60 to-cyan-500/70",
};

const ringBySymbol: Record<string, string> = {
    BTC: "ring-amber-300/60",
    ETH: "ring-sky-300/70",
    SOL: "ring-emerald-300/70",
};

export default function HomeHero({ tokens }: { tokens: TokenRow[] }) {
    const [activeSymbol, setActiveSymbol] = useState(tokens[0]?.symbol);

    const active = useMemo(
        () => tokens.find((t) => t.symbol === activeSymbol) ?? tokens[0],
        [tokens, activeSymbol]
    );

    if (!active) return null;

    const isPositive = active.delta24 >= 0;
    const gradient =
        gradientBySymbol[active.symbol.toUpperCase()] ??
        "from-slate-500/60 via-slate-700/60 to-slate-900/80";
    const ring =
        ringBySymbol[active.symbol.toUpperCase()] ?? "ring-slate-300/60";

    return (
        <section className="max-w-6xl mx-auto px-6 py-10 lg:py-16">
            {/* Top label / tagline */}
            <div className="mb-8 flex flex-col gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-slate-400">
                    <span className="h-[1px] w-6 bg-slate-600" />
                    Crypto Sentiment Analyzer
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-50">
                    Real-time mood across{" "}
                    <span className="text-emerald-300">top tokens</span>.
                </h1>
                <p className="max-w-xl text-sm sm:text-base text-slate-400">
                    We scan recent Reddit and news headlines, estimate title-level mood,
                    blend it with 24h price momentum, and give you a fast, visual read on
                    the market vibe.
                </p>
            </div>

            {/* Main card */}
            <div className="relative">
                {/* glow */}
                <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-400/10 via-cyan-400/5 to-amber-400/10 blur-2xl" />

                <div className="relative flex flex-col lg:flex-row gap-6 rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-950/90 p-6 lg:p-8 shadow-[0_0_60px_rgba(15,23,42,0.9)]">
                    {/* Left: big icon + token picker */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-6 items-center">
                        {/* big circle */}
                        <div
                            className={`relative h-52 w-52 rounded-full bg-gradient-to-br ${gradient} ring-4 ${ring} shadow-[0_0_80px_rgba(56,189,248,0.35)] flex items-center justify-center`}
                        >
                            <div className="h-36 w-36 rounded-full bg-slate-950/80 flex items-center justify-center border border-white/10">
                                <span className="text-4xl font-semibold tracking-wider text-slate-50">
                                    {active.symbol.toUpperCase()}
                                </span>
                            </div>

                            {/* subtle orbit ring */}
                            <div className="pointer-events-none absolute inset-2 rounded-full border border-white/10 border-dashed" />
                        </div>

                        {/* token list */}
                        <div className="flex lg:flex-col gap-1 w-full justify-center items-stretch lg:w-auto">
                            {tokens.map((t) => {
                                const selected = t.symbol === active.symbol;
                                const deltaRaw = t.delta24 ?? 0;
                                const delta = Math.abs(t.delta24).toFixed(2);
                                const isUp = deltaRaw >= 0;
                                const arrow = isUp ? "▲" : "▼";

                                return (
                                    <button
                                        key={t.symbol}
                                        onClick={() => setActiveSymbol(t.symbol)}
                                        className={`group h-full flex-1 lg:flex-none flex items-center gap-1.5 
                                            rounded-lg sm:rounded-xl 
                                            border border-slate-700/60
                                            px-1.5 py-1 sm:px-2.5 sm:py-2 
                                            text-left transition cursor-pointer
                                            min-w-[7rem] sm:min-w-[9.5rem]
                                            ${
                                                selected
                                                    ? "border-emerald-400/80 bg-emerald-400/10"
                                                    : "border-slate-700/80 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900"  
                                            }`}
                                        >
                                            <div 
                                                className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br ${
                                                    gradientBySymbol[t.symbol.toUpperCase()] ?? 
                                                    "from-slate-500 to-slate-800"
                                                } flex items-center justify-center text-[8px] sm:text-[10px] font-semibold text-white`}
                                            >
                                                {t.symbol.toUpperCase()}
                                            </div>

                                            <div className="flex flex-col leading-tight">
                                                <span className="text-[11px] sm:text-sm font-medium text-slate-50">
                                                    {t.name}
                                                </span>

                                                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                                    Score {t.score}
                                                </span>

                                                {/* highlighted delta pill */}
                                                <span 
                                                    className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5
                                                        text-[8px] sm:text-[10px] font-medium
                                                        ${
                                                            isUp
                                                                ? "bg-emerald-500/12 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.45)]"
                                                                : "bg-rose-500/12 text-rose-300 shadow-[0_0_10px_rgba(248,113,113,0.45)]"
                                                        }`}                                                 
                                                >
                                                    {arrow} {delta}%
                                                </span>
                                            </div>
                                        </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: details */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* header row */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50">
                                        {active.name}
                                    </h2>
                                    <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-medium tracking-[0.18em] uppercase text-slate-400">
                                        {active.symbol.toUpperCase()}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    Unified sentiment score from 0-100. Higher = more bullish
                                    overall mood.
                                </p>
                            </div>

                            <div className="flex flex-col items-start sm:items-end gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 border border-slate-700/80">
                                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                        Score
                                    </span>
                                    <span className="text-xl font-semibold text-emerald-300">
                                        {active.score}
                                    </span>
                                </div>
                                <div className="text-sm">
                                    <span
                                        className={`font-medium ${
                                            isPositive ? "text-emerald-300" : "text-rose-300"
                                        }`}
                                    >
                                        {isPositive ? "▲" : "▼"}{" "}
                                        {Math.abs(active.delta24).toFixed(2)}%
                                    </span>
                                    <span className="ml-1 text-xs text-slate-400">
                                        vs last 24h
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* mini stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard
                                label="Headline mood"
                                value={
                                    isPositive ? "Leaning positive" : "Leaning cautious / negative"
                                }
                            />
                            <StatCard
                                label="24h momentum"
                                value={isPositive ? "Cooling up" : "Cooling down"}
                            />
                            <StatCard
                                label="Use it for"
                                value="Quick vibe-check before deeper research."
                            />
                        </div>

                        {/* CTA row */}
                        <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-500 max-w-md">
                                This is a demo research tool. Sentiment is noisy; always combine
                                it with fundamentals and your own judgment.
                            </p>
                            <Link
                                href={`/token/${active.symbol}`}
                                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:bg-emerald-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.8)] transition"
                            >
                                View full sentiment details
                                <span className="ml-2 text-base">↗</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-1">
                {label}
            </div>
            <div className="text-sm text-slate-200">{value}</div>
        </div>
    );
}
