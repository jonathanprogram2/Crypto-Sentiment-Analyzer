import { fetchOg } from "@/lib/og";
import Image from "next/image";
import { useRouter } from "next/navigation";

async function getTokenDetail(symbol: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/token/${symbol}?window=7d`, {
        next: { revalidate: 60 * 15 },
    });
    if (!res.ok) throw new Error("Failed to fetch token detail");
    return res.json() as Promise<{
        symbol: string;
        name: string;
        evidence: { title: string; url?: string; source: string; polarity: "Positive" | "Neutral" | "Negative"; publishedAt?: string }[];
    }>;
}

type Item = {
    title: string;
    url?: string;
    source: string;
    polarity: "Positive" | "Neutral" | "Negative";
    publishedAt?: string;
    image?: string | null;
    description?: string | null;
};

const DAYS_WINDOW = 7;
const msPerDay = 24 * 60 * 60 * 1000;
const now = Date.now();

function safeDate(iso?: string) {
    if (!iso) return new Date();
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date() : d;
}
function withinWindow(d: Date) {
    return (now - d.getTime()) <= DAYS_WINDOW * msPerDay;
}
function dayKey(d: Date) {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function ExplorePage({
    searchParams,
}: {
    searchParams?: { symbol?: string };
}) {
    const symbol = (searchParams?.symbol ?? "btc").toLowerCase();
    const detail = await getTokenDetail(symbol);

    // single feed (newest to oldest), keep last 7 days where I can
    const raw: Item[] = (detail.evidence ?? [])
        .filter(e => (e.title?.trim()?.length ?? 0) > 0)
        .map(e => ({
            title: e.title,
            url: e.url,
            source: e.source,
            polarity: e.polarity,
            publishedAt: e.publishedAt,
        }))
        .filter(i => withinWindow(safeDate(i.publishedAt)));

        raw.sort((a, b) => {
            const da = safeDate(a.publishedAt).getTime();
            const db = safeDate(b.publishedAt).getTime();
            return db - da;
        });

        // Enrich the top N with OG thumbnails/description
        const ENRICH_COUNT = 20;
        const head = await Promise.all(
            raw.slice(0, ENRICH_COUNT).map(async (i) => {
                if (!i.url) return i;
                const og = await fetchOg(i.url);
                return { ...i, image: og.image ?? null, description: og.description ?? null, publishedAt: i.publishedAt || og.publishedAt || undefined };
            })
        );
        const tail = raw.slice(ENRICH_COUNT);
        const feed = [...head, ...tail];

        const byDay = feed.reduce<Record<string, Item[]>>((acc, it) => {
            const d = safeDate(it.publishedAt);
            const key = dayKey(d);
            (acc[key] ??= []).push(it);
            return acc;
        }, {});
        const dayBuckets = Object.entries(byDay).sort(
            (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
        );

        // If nothing to show, render a quiet page
        if (feed.length === 0) {
            return (
                <div className="max-w-6xl mx-auto px-6 py-10">
                    <h1 className="text-3xl font-semibold">Explore <span className="text-slate-400">/ {detail.name}</span></h1>
                    {/* intentionally empty when no items */}
                </div>
            );
        }

        const router = useRouter();

        return (
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-semibold">Explore <span className="text-slate-400">/ {detail.name}</span></h1>
                    <button onClick={() => router.push(`/token/${symbol.toLowerCase()}`)} className="rounded-md bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-200">← Back to Detail</button>
                </div>

                {/* Single news column */}
                {dayBuckets.map(([day, list]) => (
                    <section key={day} className="mb-8">
                        <div className="sticky top-14 z-10">
                            <h3 className="px-2 py-1 inline-block rounded bg-white/5 ring-1 ring-white/10 text-slate-200 text-sm">
                                {day}
                            </h3>
                        </div>

                        <ul className="mt-3 space-y-4">
                        {list.map((it, idx) => (
                            <li key={idx} className="rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
                                <a href={it.url ?? "#"} target={it.url ? "_blank" : "_self"} className="block">
                                    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0 md:gap-4">
                                        {/* Thumb */}
                                        {it.image ? (
                                            <div className="relative h-48 md:h-full md:min-h-[160px]">
                                                <Image
                                                    src={it.image}
                                                    alt=""
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 240px"
                                                    className="object-cover"
                                                    onError={(e) => { (e.currentTarget as any).style.display = 'none'; }}
                                                />
                                            </div>
                                        ) : (
                                            // If no image, don't render an empty box — just omit the left column on desktop.
                                            <div className="hidden md:block md:min-h-[0]" />
                                        )}

                                        {/* Text block */}
                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold leading-snug text-slate-100">
                                                {it.title}
                                            </h3>
                                            {it.description && (
                                                <p className="mt-2 text-sm text-slate-300 line-clamp-3">{it.description}</p>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                                <span className="px-2 py-0.5 rounded-full ring-1 ring-white/10 bg-white/5 text-slate-300">
                                                    {it.source}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full ring-1 ${
                                                    it.polarity === "Positive" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" :
                                                    it.polarity === "Negative" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30" :
                                                    "bg-slate-500/15 text-slate-300 ring-slate-400/30"
                                                }`}>
                                                    {it.polarity}
                                                </span>
                                                {it.publishedAt && (
                                                    <span className="text-slate-400">
                                                        {new Date(it.publishedAt).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </li>
                    ))}
                </ul>
                    </section>
                ))}




                
            </div>
        );

}



