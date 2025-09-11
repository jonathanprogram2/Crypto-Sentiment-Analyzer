"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { callback } from "chart.js/helpers";
import { title } from "process";
import { Line } from "react-chartjs-2";


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export type DayRow = { date: string; price: number; sentiment: number };

export default function TrendLine({ rows, windowSel, }: { rows: DayRow[]; windowSel: "24h" | "7d" }) {
    const labels = rows.map((r) => r.date);
    const prices = rows.map((r) => r.price);

    // Robust parse for "YYYY-MM-DD HH:mm" or ISO
    const parse = (s: string) => new Date(s.includes(" ") ? s.replace(" ", "T") : s);

    const formatTick = (i: number) => {
        const d = parse(labels[i]);
        return windowSel === "24h"
            ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }) // 12:00 AM
            : d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const formatTooltipTitle = (i: number) => {
        const d = parse(labels[i]);
        return windowSel === "24h"
            ? d.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }) // Sep 7, 12:00 AM
            : d.toLocaleDateString([], { month: "short", day: "numeric" }); // Sep 7

    }

    const data = {
        labels,
        datasets: [
            {
                label: "Price",
                data: prices,
                borderColor: "rgba(250, 204, 21, 1)",
                backgroundColor: "rgba(250, 204, 21, 0.12)",
                fill: true,
                tension: 0.35,
                pointRadius: 0,
                borderWidth: 2,
            },
        ],
    };

    const options  = {
        responsive: true,
        maintainAspectRatio: false as const,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: "index" as const,
                intersect: false,
                callbacks: {
                    title: (items: any[]) => formatTooltipTitle(items[0].dataIndex),
                    label: (ctx: any) => `$${Number(ctx.parsed.y).toLocaleString()}`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: "rgba(255,255,255,0.06)"},
                ticks: { color: "rgba(226,232,240,0.9)", maxRotation: 0, autoSkip: true, callback: (_val: any, i: number) => formatTick(i),},
            },
            y: {
                grid: { color: "rgba(255,255,255,0.06)"},
                ticks: {
                    color: "rgba(226,232,240,0.9)",
                    callback: (v: any) => `$${Number(v).toLocaleString()}`,
                },
            },
        },
    };

    return (
        <div className="h-64 md:h-72">
            <Line data={data} options={options} />
        </div>
    );
}