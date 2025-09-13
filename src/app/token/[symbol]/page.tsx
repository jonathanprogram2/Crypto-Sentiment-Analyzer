import TokenDetailClient from "@/components/TokenDetailClient";

export default async function TokenPage(props: { params: Promise<{ symbol: string }> }) {
    const { symbol } = await props.params;
    return <TokenDetailClient symbol={symbol.toLowerCase()} />
}