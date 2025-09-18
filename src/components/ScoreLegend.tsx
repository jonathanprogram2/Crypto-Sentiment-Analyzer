"use client";
import { useState } from "react";

export default function ScoreLegend() {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative inline-block">
            <button
                type="button"
                className="ml-2 text-slate-300/80 hover:text-white underline underline-offset-4"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                aria-label="Score legend"
            >
                What does this mean?
            </button>

            {open && (
                <div
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                    className="absolute z-50 mt-2 w-64 rounded-xl bg-slate-900 ring-1 ring-white/10 p-4 shadow-xl"
                    role="tooltip"
                >
                    <p className="text-sm text-slate-200 mb-2">Score bands</p>
                    <ul className="space-y-1 text-sm">
                        <li><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2" />&gt;= 90: strong positive (glows green)</li>
                        <li><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2" />70-89: positive (glows yellow)</li>
                        <li><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-2" />60-69: caution (glows orange)</li>
                        <li><span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-2" />&lt; 60: weak/negative (glows red)</li>
                    </ul>
                </div>
            )}
        </div>
    );
}