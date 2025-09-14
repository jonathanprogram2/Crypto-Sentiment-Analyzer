"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const TOKENS = [
    { label: "Bitcoin (BTC)", value: "btc" },
    { label: "Ethereum (ETH)", value: "eth" },
    { label: "Solana (SOL)", value: "sol" },
];

export default function NavBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [left, setLeft] = useState("btc");
    const [right, setRight] = useState("eth");

    const isDetail = pathname?.startsWith("/token/");
    const crumb = isDetail ? pathname?.split("/").filter(Boolean).slice(-1)[0]?.toUpperCase() : null;

    return (
        <div className="sticky top-0 z-40 w-full bg-slate-900/70 backdrop-blur border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isDetail ? (
                        <button
                            className="text-slate-300 hover:text-white cursor-pointer"
                            onClick={() => router.back()}
                        >
                            ← Back
                        </button>
                    ) : (
                        <span className="text-slate-400">Home</span>
                    )}
                    <span className="text-slate-600">/</span>
                    <Link href="/" className="text-slate-300 hover:text-white cursor-pointer">
                        Discover
                    </Link>
                    {isDetail && (
                        <>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-200 font-medium">{crumb}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-300 hover:text-white cursor-pointer">
                        Explore
                    </Link>
                    <button
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700 cursor-pointer"
                        onClick={() => setOpen(true)}
                    >
                        Compare
                    </button>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl bg-slate-900 ring-1 ring-white/10 p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-semibold">Compare tokens (prototype)</h4>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                    aria-label="Close"
                                >
                                   ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm text-slate-300">
                                    Left token
                                    <select
                                        className="mt-1 w-full rounded-md bg-slate-800 text-slate-100 px-3 py-2 ring-1 ring-white/10"
                                        value={left}
                                        onChange={(e) => setLeft(e.target.value)}
                                    >
                                        {TOKENS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </label>

                                <label className="block text-sm text-slate-300">
                                    Right token
                                    <select
                                        className="mt-1 w-full rounded-md bg-slate-800 text-slate-100 px-3 py-2 ring-1 ring-white/10"
                                        value={right}
                                        onChange={(e) => setRight(e.target.value)}
                                    >
                                        {TOKENS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </label>

                                <p className="text-xs text-slate-400">
                                    This is a prototype interaction. In Iteration 3 I'll land a side-by-side view using the same data endpoints.
                                </p>

                                <div className="text-right">
                                    <button
                                        onClick={() => {
                                            setOpen(false);
                                            // In a later iteration, route to / compare?left=...&right=...
                                        }}
                                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-white cursor-pointer"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
