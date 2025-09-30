"use client";

import * as React from "react";
import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    TooltipProps,
} from "recharts";

const GoldOnlyTooltip = ({
    active,
    label,
    payload,
}: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;

    const p = payload.find(d => d.dataKey === "price") ?? payload[0];

    return (
        <div 
            style={{
                background: "#000000",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 12,
                padding: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,.4)",
            }}
        >
            <div style={{ color: "rgba(226,232,240,.9)", fontSize: 14 }}>
                {new Date(Number(label)).toLocaleString([], {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </div>
            <div
                style={{
                    color: "#f4c430",
                    fontWeight: 600,
                    fontSize: 16,
                    marginTop: 4,
                }}
            >
                Price: ${Number(p.value).toLocaleString()}
            </div>
        </div>
    );
};

type Row = { date: string; price: number; sentiment?: number };

export default function TrendLine({ 
    rows, 
    windowSel, 
}: { 
    rows: Row[]; 
    windowSel: "24h" | "7d";
}) {
    const data = React.useMemo(
        () => 
            (rows ?? []).map((r) => ({
                t: new Date(r.date).getTime(),
                price: Number(r.price),
            })),
        [rows]
    );

    const formatX = (t: number ) =>
        windowSel === "24h"
            ? new Date(t).toLocaleTimeString([], { hour: "numeric" })
            : new Date(t).toLocaleDateString([], { month: "short", day: "2-digit" });

    const gradientId = React.useId();


    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart 
                    data={data} 
                    margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                >
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                        dataKey="t"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={formatX}
                        tick={{ fill: "rgba(226,232,240,.7)", fontSize: 12 }}
                    />
                    <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                        width={64}
                        tick={{ fill: "rgba(226,232,240,.7)", fontSize: 12 }}
                    />
                    

                    {/* gradient fill under the line */}
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f4c430" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#f4c430" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <Tooltip content={<GoldOnlyTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="none"
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                    />

                    {/* plot all points */}
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#f4c430"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </ComposedChart>  
            </ResponsiveContainer>
        </div>
    );
}