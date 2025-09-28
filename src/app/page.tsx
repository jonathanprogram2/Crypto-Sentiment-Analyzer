import Link from "next/link";
import { headers } from "next/headers";

type Row = { symbol: string; name: string; score: number; delta24: number };

async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3300";
  return `${proto}://${host}`;

}

async function getData(): Promise<Row[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/discover`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed /api/discover (${res.status})`);
  }
  const j = await res.json();
  return j.tokens as Row[];
}

export default async function DiscoverPage() {
  const rows = await getData();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-6">Discover</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(t => (
          <Link key={t.symbol} href={`/token/${t.symbol}`}>
            <div className="rounded-2xl bg-white/30 ring-1 ring-white/20 p-4 hover:bg-white/10 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {t.name} <span className="text-slate-400">({t.symbol.toUpperCase()})</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-yellow-200 font-semibold">
                    {t.score}
                  </span>
                  <span className={t.delta24 >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {t.delta24 >= 0 ? "▲" : "▼"} {Math.abs(t.delta24).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}