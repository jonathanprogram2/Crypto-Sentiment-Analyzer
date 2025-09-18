// Map percent change to a 0..100 score consistently across the app.
// -10% -> 0, 0% -> 50, +10% -> 100 (clamped)
export function scoreFromChange(deltaPct: number): number {
    const k = 2.2;
    const s = Math.max(0, Math.min(100, Math.round(50 + deltaPct * k)));
    return s;
}

// Bands + UI helpers for glow + legend
export type ScoreBand = "green" | "yellow" | "orange" | "red";

export function scoreBand(score: number): ScoreBand {
    if (score >= 90) return "green";
    if (score >= 70) return "yellow";
    if (score >= 60) return "orange";
    return "red";
}

export function scoreGlowClasses(score: number): string {
    const band = scoreBand(score);
    // Tailwind-friendly glow per band
    switch (band) {
        case "green":
            return "ring-emerald-400/40 shadow-[0_0_24px_-6px] shadow-emerald-400/60 text-emerald-300";
        case "yellow":
            return "ring-yellow-400/40 shadow-[0_0_24px_-6px] shadow-yellow-400/60 text-yellow-300";
        case "orange":
            return "ring-orange-400/40 shadow-[0_0_24px_-6px] shadow-orange-400/60 text-orange-300";
        default:
            return "ring-rose-400/40 shadow-[0_0_24px_-6px] shadow-rose-400/60 text-rose-300"
    }
}