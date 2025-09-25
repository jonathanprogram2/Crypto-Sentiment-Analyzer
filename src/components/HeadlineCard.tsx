"use client";
import Image from "next/image";

type Pol = "Positive" | "Neutral" | "Negative";
type Item = { title: string; source: string; url?: string; polarity: Pol; ts?: string };
type Enrich = { image?: string; description?: string; siteName?: string; favicon?: string };

export default function HeadlineCard({
    item,
    enrich,
    onOpen,
}: { item: Item; enrich?: Enrich; onOpen: () => void}) {
    const chip =
        item.polarity === "Positive"
            ? "text-emerald-300 bg-emerald-500/10 ring-emerald-400/30"
            : item.polarity === "Negative"
            ? "text-rose-300 bg-rose-500/10 ring-rose-400/30"
            : "text-slate-300 bg-slate-500/10 ring-slate-400/30";
    
    return (
        <article
            className="rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer"
            onClick={onOpen}
            role="button"
            aria-label={`Open: ${item.title}`}
        >
            {enrich?.image ? (
                <div className="relative aspect-[16/9] bg-slate-800">
                    <Image
                        src={enrich.image}
                        alt={item.title}
                        fill
                        sizes="(max-width:768px) 100vw, 33vw"
                        className="object-cover"
                        unoptimized
                    />
                </div>
            ) : (
                <div className="aspect-[16/9] bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
                    No image
                </div>
            )}

            <div className="p-3 space-y-2">
                <h4 className="font-semibold leading-snug line-clamp-2">{item.title}</h4>
                {enrich?.description ? (
                    <p className="text-xs text-slate-400 line-clamp-2">{enrich.description}</p>
                ) : null}
                <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">{enrich?.siteName ?? item.source}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] ring-1 ${chip}`}>{item.polarity}</span>
                </div>
            </div>
        </article>
    );
}