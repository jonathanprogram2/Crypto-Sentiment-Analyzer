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
                onClick={() => setOpen(true)}
                className="rounded-md bg-[#40422D] border border-white hover:bg-[#A1A671] hover:text-white px-3 py-1.5 text-sm text-slate-200 cursor-pointer"
            >
                How it works
            </button>

            <dialog
                ref={dialogRef}
                style={{ margin: "auto" }}
                className="backdrop:bg-black/60 rounded-2xl p-0 w-[min(92vw,48rem)] text-slate-200"
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
                <div className="bg-[#8F8F7C] border-2 border-black rounded-2xl overflow-hidden ring-1 ring-white/10">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-black">How Crypto Sentiment Analyzer Works</h2>
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-md px-2 py-1 text-black hover:bg-white/10 cursor-pointer"
                            aria-label="Close"
                        >
                           ✕ 
                        </button>
                    </div>

                    <div className="p-6 space-y-6 text-[1.05rem] leading-relaxed text-black">
                        <section>
                            <h3 className="font-semibold mb-1 text-black">Overview</h3>
                            <p>
                                We grab fresh headlines about <b>BTC</b>, <b>ETH</b>, and <b>SOL</b>, guess the 
                                headline's mood, and combine that with the last 24-hour price move. You get a simple, 
                                quick view of the vibe. It's a demo tool — not trading advice.
                            </p>
                        </section>

                        <section className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h3 className="font-semibold mb-1">Where the news comes from</h3>
                                <ul className="list-disc ml-6 space-y-1">
                                    <li><b>Reddit</b> — recent posts we find for each token.</li>
                                    <li><b>Google News</b> — headlines from the last 7 days.</li>
                                    <li><b>Hacker News</b> — recent stories via Algolia.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">How the scores work</h3>
                                <ul className="list-disc ml-6 space-y-1">
                                    <li><b>Headline Mood</b> — we read the title only and label it
                                        <i> Positive</i>, <i>Neutral</i>, or <i>Negative</i>.</li>
                                    <li><b>Unified Score (0 - 100)</b> — maps the token's <i>24h price change </i>
                                        so you can compare tokens at a glance.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="font-semibold mb-2">Explore</h3>
                                <p>
                                    The Explore page shows articles from today and the last 7 days, with thumbnails,
                                    sources, mood chips, and a quick date label. Use the dropdown and search to filter.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Compare</h3>
                                <p>
                                    Pick two tokens and see <b>score, price</b>, and the latest <b>evidence</b> side-by-side.
                                    The "Who's hot? 🔥" hint ranks tokens by 24h momentum.
                                </p>
                            </div>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="font-semibold mb-2">Heatmap</h3>
                                <p>
                                    The heatmap gives a bird's-eye view: tiles highlight which tokens are heating up or
                                    cooling down. Bigger/brighter tiles = more activity and stronger moves at a glance.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Good to know</h3>
                                <ul className="list-disc ml-6 space-y-1">
                                    <li>Headlines can be noisy; mood is an approximation.</li>
                                    <li>Public APIs have rate limits; if a feed looks empty, try again soon.</li>
                                    <li>No accounts or tracking; this is for learning and exploration.</li>
                                </ul>
                            </div>
                        </section>
                    </div>

                    <div className="px-6 py-4 border-t border-white/10 flex justify-end">
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-md bg-black hover:bg-white/20 px-5 py-2 text-[1.05rem] cursor-pointer"
                        >
                            Got it?
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}