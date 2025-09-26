import * as cheerio from "cheerio";

export type OgInfo = {
    image?: string | null;
    description?: string | null;
    publishedAt?: string | null;
};

export async function fetchOg(url: string, abortMs = 6000): Promise<OgInfo> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), abortMs);

    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; CSA-og/1.0)" },
            signal: ctrl.signal,
            // Revalidate daily
            next: { revalidate: 60 * 60 * 24 },
        });
        if (!res.ok) return {};
        const html = await res.text();
        const $ = cheerio.load(html);

        const get = (sel: string) => $(`meta[property="${sel}"]`).attr("content")
            || $(`meta[name="${sel}"]`).attr("content")
            || undefined;

        const image = get("og:image") || get("twitter:image");
        const description = get("og:description") || get("twitter:description") || get("description");
        const publishedAt = 
            get("article:published_time") ||
            get("og:updated_time") ||
            get("date");

        return { image: image || null, description: description || null, publishedAt: publishedAt || null };
    } catch {
        return {};
    } finally {
        clearTimeout(t);
    }
}