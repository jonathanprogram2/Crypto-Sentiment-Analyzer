"use client";

import { useEffect, useRef, useState } from "react";

export default function HowItWorks() {
    const [open, setOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Close on ESC and when clicking the backdrop
    useEffect(() => {
        const dlg = dialogRef.current;
        if (!dlg) return;
        function onCancel(e: Event) { e.preventDefault(); setOpen(false); }
        dlg.addEventListener("cancel", onCancel);
        return () => dlg.removeEventListener("cancel", onCancel);
    }, []);

    useEffect(() => {
        const dlg = dialogRef.current;
        if (!dlg) return;
        if (open && !dlg.open) dlg.showModal();
        if (!open && dlg.open) dlg.close();
    }, [open]);

    return (
        <>
            <button
                className="nav-shimmer-btn nav-shimmer-help"
                onClick={() => setOpen(true)}
            >
               <span className="nav-shimmer-text">How it works</span> 
               <span className="nav-shimmer-layer" />
            </button>

            <dialog
                ref={dialogRef}
                style={{ margin: "auto" }}
                className="backdrop:bg-black/60 p-0 bg-transparent border-none w-[min(92vw,56rem)]"
                onClick={(e) => {
                    // click outside panel closes
                    const rect = (e.target as HTMLDialogElement).getBoundingClientRect();
                    const inside = 
                        e.clientX >= rect.left &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.bottom;
                    if (!inside) setOpen(false);
                }}
            >
                <div 
                    className="
                        relative rounded-3xl overflow-hidden 
                        border border-lime-200/10 ring-1 ring-lime-300/25 
                        bg-[radial-gradient(circle_at_0_0,#22c55e33,transparent_55%),radial-gradient(circle_at_100%_0,#eab30833,transparent_55%),linear-gradient(to_bottom,#020617,#020617)]  
                        shadow-[0_0_60px_-10px_rgba(34,197,94,0.7)]
                        text-slate-100
                    "
                 >
                    {/* subtle glow strip at top */}
                    <div className="h-1 w-full bg-gradient-to-r from-lime-400 via-emerald-400 to-sky-400 opacity-70" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div>
                            <p className="text-xs tracking-[0.22em] uppercase text-lime-300/80">
                                Guide
                            </p>
                            <h2 className="text-lg font-semibold">
                                How Crypto Sentiment Analyzer Works
                            </h2>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-full px-2.5 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/20 text-slate-200 cursor-pointer"
                            aria-label="Close"
                        >
                           ✕ 
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6 md:px-8 md:py-7 space-y-6 text-sm leading-relaxed">
                        {/* Overview */}
                        <section className=" rounded-2xl bg-white/5 border border-white/10 px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
                            <h3 className="font-semibold mb-2 text-slate-50">
                                Overview
                            </h3>
                            <p className="text-slate-200/90">
                                    We grab fresh headlines about <b>BTC</b>, <b>ETH</b>, and <b>SOL</b>, 
                                    guess the headline's mood, and combine that with the last 
                                    24-hour price move. You get a simple, quick view of the vibe. 
                                    It's a demo tool — <span className="text-amber-300/90">not trading advice</span>.
                            </p>    
                        </section>

                        {/* Sources + Scoring */}
                        <section className="grid gap-5 md:grid-cols-2">
                            <div className="rounded-2xl bg-white/3 border border-white/10 px-5 py-4">
                                <h3 className="font-semibold mb-2 text-slate-50">
                                    Where the news comes from
                                </h3>
                                <ul className="list-disc ml-5 space-y-1.5 text-slate-200/90">
                                    <li>
                                        <b>Reddit</b> — recent posts we find for each token.
                                    </li>
                                    <li>
                                        <b>Google News</b> — headlines from the last 7 days.
                                    </li>
                                    <li>
                                        <b>Hacker News</b> — recent stories via Algolia.
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-2xl bg-white/3 border border-white/10 px-5 py-4">
                                <h3 className="font-semibold mb-2 text-slate-50">
                                    How the scores work
                                </h3>
                                <ul className="list-disc ml-5 space-y-1.5 text-slate-200/90">
                                    <li>
                                        <b>Headline Mood</b> — we read the title only and label it
                                        <i> Positive</i>, <i>Neutral</i>, or <i>Negative</i>.
                                    </li>
                                    <li>
                                        <b>Unified Score (0 - 100)</b> — maps the token's 
                                        <i> 24h price change</i> so you can compare tokens at a glance.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Explore + Compare */}
                        <section className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-2xl bg-white/3 border border-white/10 px-5 py-4">
                                <h3 className="font-semibold mb-2 text-slate-50">
                                    Explore
                                </h3>
                                <p className="text-slate-200/90">
                                    The Explore page shows articles from today and the last 7 days, 
                                    with thumbnails, sources, mood chips, and a quick date label. 
                                    Use the dropdown and search to filter.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/3 border border-white/10 px-5 py-4">
                                <h3 className="font-semibold mb-2 text-slate-50">
                                    Compare
                                </h3>
                                <p className="text-slate-200/90">
                                    Pick two tokens and see <b>score, price</b>, and the latest{" "} 
                                    <b>evidence</b> side-by-side. 
                                </p>
                            </div>
                        </section>
                        
                        {/* Heatmap + Good to know */}
                        <section className="grid gap-5 md:grid-cols-2">
                            <div className="rounded-2xl bg-white/3 border border-white/10 px-5 py-4">
                                <h3 className="font-semibold mb-2 text-slate-50">
                                    Heatmap
                                </h3>
                                <p className="text-slate-200/90">
                                    The{" "} <span className="inline-flex items-center gap-1">
                                    &quot;Who&apos;s hot?&quot; <span>🔥</span>
                                    </span>{" "}
                                    heatmap highlights tokens with the strongest 24h momentum.
                                    Tiles highlight which tokens are heating up or cooling down. 
                                    Bigger tiles = more activity and stronger moves at a glance.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/3 border border-white/10 px-5 py-4">
                                <h3 className="font-semibold mb-2 text-slate-50">
                                    Good to know
                                </h3>
                                <ul className="list-disc ml-5 space-y-1.5 text-slate-200/90">
                                    <li>Headlines can be noisy; mood is an approximation.</li>
                                    <li>
                                        Public APIs have rate limits; if a feed looks empty, try again soon.
                                    </li>
                                    <li>No accounts or tracking; this is for learning and exploration.</li>
                                </ul>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 flex justify-end">
                        <button
                            onClick={() => setOpen(false)}
                            className="
                                rounded-full px-5 py-2 text-sm font-semibold
                                bg-emerald-500/20 text-emerald-100 
                                border border-emerald-400/40
                                shadow-[0_0_25px_rgba(16,185,129,0.55)]
                                hover:bg-emerald-500/30 hover:border-emerald-300
                                cursor-pointer"
                        >
                            Got it?
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}