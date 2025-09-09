import TokenDetailClient from "@/components/TokenDetailClient";

export default function TokenPage({ params }: { params: { symbol: string } }) {
    const { symbol } = params;
    return (
        <main>
            <TokenDetailClient symbol={symbol} />
        </main>
    );
}