import { headers } from "next/headers";
import HomeHero from "@/components/HomeHero";

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
    <main>
      <HomeHero tokens={rows} />
    </main>
  );
}