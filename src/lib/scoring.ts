// Map percent change to a 0..100 score consistently across the app.
// -10% -> 0, 0% -> 50, +10% -> 100 (clamped)
export function scoreFromChange(pct: number): number {
    if (!Number.isFinite(pct)) return 50;
    const clamped = Math.max(-10, Math.min(10, pct));
    return Math.round(((clamped + 10 ) / 20) * 100);
}