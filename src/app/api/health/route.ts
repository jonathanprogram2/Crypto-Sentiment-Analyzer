import { NextResponse } from "next/server";

const B = process.env.NEXT_PUBLIC_BASE_URL?.trim()
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3300");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const out: any = {
        baseUrl: B,
        vercelUrl: process.env.VERCEL_URL ?? null,
        nodeEnv: process.env.NODE_ENV,
    };

    try {
        const r = await fetch(`${B}/api/token/btc?window=7d`, { cache: "no-store" });
        out.apiTokenStatus = r.status;
        out.apiTokenText = r.ok ? "ok" : await r.text().catch(() => "(no text)");
        if (r.ok) {
            const j = await r.json();
            out.evidenceCount = (j?.evidence || []).length;
            out.sampleTitle = j?.evidence?.[0]?.title ?? null;
        }
    } catch (e: any) {
        out.apiTokenError = String(e?.message ?? e);
    }

    return NextResponse.json(out, { status: 200 });
}
