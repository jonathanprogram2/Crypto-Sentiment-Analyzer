"use client";
import * as React from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js").then((m) => m.default),
    { ssr: false }
) as any;

type Evidence = { source: string; title: string; polarity: "Positive" | "Negative" | "Neutral" };
type TokenSide = { symbol: string; name?: string; evidence: Evidence[] };


const COLORS = {
    Positive: "#10b981",
    Neutral: "#94a3b8",
    Negative: "#f43f5e",
};

function countBuckets(evd: Evidence[]) {
    const c = { Positive: 0, Neutral: 0, Negative: 0 } as Record<Evidence["polarity"], number>;
    for (const e of evd) c[e.polarity] = (c[e.polarity] ?? 0) + 1;
    return c;
}


export default function HeatmapTreemapPlotly({ 
    left, right,
}: { left: TokenSide; right: TokenSide}) {
    const data = React.useMemo(() => {
        // Top-level groups (one per token)
        const leftName = left.name || left.symbol.toUpperCase();
        const rightName = right.name || right.symbol.toUpperCase();

        const L = countBuckets(left.evidence);
        const R = countBuckets(right.evidence);

        type Pol = "Positive" | "Neutral" | "Negative";
        const buckets: Pol[] = ["Positive", "Neutral", "Negative"];

        function buildTree(name: string, counts: Record<Pol, number>) {
            const ids: string[] = [];
            const labels: string[] = [];
            const parents: string[] = [];
            const values: number[] = [];
            const colors: string[] = [];
            const texts: string[] = [];

            const sum =
                counts.Positive + counts.Neutral + counts.Negative;

            // root
            ids.push(name);
            labels.push(name);
            parents.push("");
            values.push(Math.max(0.0001, sum));
            colors.push("rgba(255,255,255,0.05)");
            texts.push(name);

            // children
            for (const k of buckets) {
                const v = counts[k];
                if (v > 0) {
                    ids.push(`${name}/${k}`);
                    labels.push(k);
                    parents.push(name);
                    values.push(v);
                    colors.push(COLORS[k]);
                    texts.push(`${k} — ${v}`);
                }
            }

            return { ids, labels, parents, values, colors, texts };
        }

        const LT = buildTree(leftName, L);
        const RT = buildTree(rightName, R);

        return [{
            type: "treemap" as const,
            ids: [...LT.ids, ...RT.ids],
            labels: [...LT.labels, ...RT.labels],
            parents: [...LT.parents, ...RT.parents],
            values: [...LT.values, ...RT.values],
            marker: { colors: [...LT.colors, ...RT.colors] },
            text: [...LT.texts, ...RT.texts],
            textinfo: "label+value",
            branchvalues: "total", // children sizes sum to parent
            hovertemplate:
                "<b>%{label}</b><br>" +
                "Count: %{value}<extra></extra>",
            tiling: { packing: "squarify", pad: 3 },
            pathbar: { visible: false },
        }];
    }, [left, right]);

    const layout = React.useMemo(() => ({
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 6, r: 6, t: 6, b: 6 },
        font: { color: "#e2e8f0" },
    }), []);

    const config = React.useMemo(() => ({
        displaylogo: false,
        responsive: true,
        modeBarButtonsToRemove: [
            "lasso2d","select2d","zoom2d","pan2d","zoomIn2d","zoomOut2d","autoScale2d",
            "resetScale2d","toggleSpikelines"
        ],
        toImageButtonOptions: { format: "png", filename: "sentiment-heatmap" },
    }), []);

    return (
        <div className="w-full h-[480px] rounded-xl bg-slate-900/60 ring-1 ring-white/10 p-2">
            <Plot data={data as any} layout={layout as any} config={config as any} style={{ width: "100%", height: "100%" }}/>
            <p className="mt-2 text-xs text-slate-400">
                Tile size = number of items in bucket (last 7d). Colors: Positive (green), Neutral (slate), Negative (red).
            </p>
        </div>
    );
}