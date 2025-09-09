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
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export type DayRow = { date: string; price: number; sentiment: number };

export default function TrendLine({ rows }: { rows: DayRow[] }) {
    const labels = rows.map((r) => r.date);
    const prices = rows.map((r) => r.price);

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
                    label: (ctx: any) => `$${Number(ctx.parsed.y).toLocaleString()}`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: "rgba(255,255,255,0.06)"},
                ticks: { color: "rgba(226,232,240,0.9)", maxRotation: 0, autoSkip: true},
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