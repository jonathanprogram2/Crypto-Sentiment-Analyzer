import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 880, margin: "48px auto", padding: 16 }}>
      <h1>Crypto Sentiment Analyzer — PoC</h1>
      <p>This is the P&P IV Proof of Concept. Open the BTC Token Detail below:</p>
      <p>
        <Link href="/token/btc" style={{ textDecoration: "underline" }}>
          Open /token/btc
        
        </Link>
      </p>
    </main>
  );
}