import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then(r => {
    if (!r.ok) throw new Error(`Failed ${u} (${r.status})`);
    return r.json();
});

export function useTokenDetail(symbol: string, windowSel: "24h" | "7d") {
    const { data, error, isLoading } = useSWR(`/api/token/${symbol}`, fetcher, {
        revalidateOnFocus: false,
    });

    const rows = data ? (windowSel === "24h" ? data.twentyFour : data.sevenDay) : [];

    return { data, rows, error, isLoading };
}