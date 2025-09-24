import ExploreClient from "@/components/ExploreClient";

export default function ExplorePage({
    searchParams,
}: {
    searchParams?: { symbol?: string };
}) {
    const symbol = (searchParams?.symbol ?? "btc").toLowerCase();
    return <ExploreClient initialSymbol={symbol} />
}