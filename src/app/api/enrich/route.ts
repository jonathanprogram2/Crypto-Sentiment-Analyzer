import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// simple in-memory cache (1h)
const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 1000 * 60 * 60;
 
function pickMeta($: cheerio.CheerioAPI, names: string[]) {
    for (const n of names) {
        const v =
            $(`meta[property="${n}"]`).attr("content") ??
            $(`meta[name="${n}"]`).attr("content");
        if (v) return v;
    }
    return undefined;
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const cached = cache.get(url);
    if (cached && Date.now() - cached.at < TTL_MS) {
        return NextResponse.json(cached.data);
    }

    try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const html = await res.text();
        const $ = cheerio.load(html);

        const image =
            pickMeta($, ["og:image:secure_url", "og:image", "twitter:image"]) ||
            undefined;
        const description = 
            pickMeta($, ["og:description", "description", "twitter:description"]) ||
            "";
        const siteName = 
            pickMeta($, ["og:site_name"]) || new URL(url).hostname;
        const favicon =
            $('link[rel="icon"]').attr("href") ||
            $('link[rel="shortcut icon"]').attr("href") ||
            "/favicon.ico";

        const data = { image, description, siteName, favicon };
        cache.set(url, { at: Date.now(), data });
        return NextResponse.json(data);
    } catch {
        const data = {
            image: undefined,
            description: "",
            siteName: new URL(url).hostname,
            favicon: "/favicon.ico",
        };
        cache.set(url, { at: Date.now(), data });
        return NextResponse.json(data);
    }
}